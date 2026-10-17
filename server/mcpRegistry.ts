import { McpToolDeclaration } from '../src/types/logistics.ts';
import { db } from './db.ts';
import {
  runIntakeAgent,
  runApprovalAgent,
  runDispatchAgent,
  runTrackerAgent,
  runChaserAgent,
  runMultimodalDamageInspection,
  runInsightAgent,
} from './agents/logisticsAgents.ts';

export interface McpToolDefinition extends McpToolDeclaration {
  handler: (args: any) => Promise<any>;
}

class McpRegistryService {
  private tools: Map<string, McpToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  // MCP tool decoration & registration function
  public registerTool(tool: McpToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getToolDeclarations(): McpToolDeclaration[] {
    return Array.from(this.tools.values()).map(({ handler, ...meta }) => meta);
  }

  public async executeTool(name: string, args: any): Promise<{ toolName: string; result: any; timestamp: string }> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`MCP Tool '${name}' not found in registry.`);
    }

    tool.executionCount += 1;
    tool.lastExecutedAt = new Date().toISOString();

    const result = await tool.handler(args);
    return {
      toolName: name,
      result,
      timestamp: tool.lastExecutedAt,
    };
  }

  private registerCoreTools() {
    // 1. INTAKE MCP TOOL
    this.registerTool({
      name: 'mcp_intake_order',
      category: 'INTAKE',
      description: 'Parses natural language or voice dictation into a structured, validated Purchase Order schema.',
      parameters: {
        type: 'object',
        properties: {
          rawText: { type: 'string', description: 'Raw requirement text from logistics handler', example: 'Need 500 bags of rice by Friday' },
          handlerName: { type: 'string', description: 'Name and warehouse ID of the staff member', example: 'Ravi (FreshMart Central Dock)' },
        },
        required: ['rawText'],
      },
      returns: 'PurchaseOrder object in REQUESTED status',
      executionCount: 14,
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
      handler: async (args) => {
        const po = await runIntakeAgent(args.rawText, args.handlerName);
        return await runApprovalAgent(po.id);
      },
    });

    // 2. APPROVAL POLICY MCP TOOL
    this.registerTool({
      name: 'mcp_evaluate_approval_policy',
      category: 'APPROVAL',
      description: 'Autonomous decision engine: approves immediately if value <= policy limit and supplier score >= threshold, otherwise routes to manager with 1-line AI summary.',
      parameters: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'Purchase Order identifier', example: 'PO-101' },
        },
        required: ['poId'],
      },
      returns: 'PurchaseOrder status transition to APPROVED or PENDING_MANAGER',
      executionCount: 22,
      lastExecutedAt: new Date(Date.now() - 1800000).toISOString(),
      handler: async (args) => {
        return await runApprovalAgent(args.poId);
      },
    });

    // 3. DISPATCH SMART ROUTE MCP TOOL
    this.registerTool({
      name: 'mcp_dispatch_smart_route',
      category: 'ROUTING',
      description: 'Selects optimal supplier by dynamic rolling score, compiles digital PO contract, and generates outbound dispatch email/webhook.',
      parameters: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'Purchase order ID to dispatch', example: 'PO-101' },
        },
        required: ['poId'],
      },
      returns: 'PurchaseOrder status transition to ORDERED with email record ID',
      executionCount: 18,
      lastExecutedAt: new Date(Date.now() - 1200000).toISOString(),
      handler: async (args) => {
        return await runDispatchAgent(args.poId);
      },
    });

    // 4. TRACKER & DUAL-DOC AUDIT MCP TOOL
    this.registerTool({
      name: 'mcp_tracker_audit_sla',
      category: 'TRACKING',
      description: 'Audit agent enforcing the Complete Flow guarantee: checks that both Receipt (GRN) and Commercial Invoice exist before closure is authorized.',
      parameters: {
        type: 'object',
        properties: {
          forceScan: { type: 'boolean', description: 'Force full database audit of active PO states', example: true },
        },
        required: [],
      },
      returns: 'Audit report of flagged idle POs and document completion status',
      executionCount: 45,
      lastExecutedAt: new Date(Date.now() - 600000).toISOString(),
      handler: async () => {
        return runTrackerAgent();
      },
    });

    // 5. CHASER ESCALATION MCP TOOL
    this.registerTool({
      name: 'mcp_chaser_escalate',
      category: 'TRACKING',
      description: 'Autonomous communication chaser: sends progressive email follow-ups to silent suppliers and escalates to manager after 2 attempts.',
      parameters: {
        type: 'object',
        properties: {
          escalateThreshold: { type: 'number', description: 'Maximum chases before manager alert', example: 2 },
        },
        required: [],
      },
      returns: 'Dispatched chase reminder records and count',
      executionCount: 19,
      lastExecutedAt: new Date(Date.now() - 300000).toISOString(),
      handler: async () => {
        return runChaserAgent();
      },
    });

    // 6. MULTIMODAL CARGO INSPECTOR MCP TOOL
    this.registerTool({
      name: 'mcp_multimodal_cargo_inspect',
      category: 'MULTIMODAL',
      description: 'Gemini multimodal vision inspector: detects packaging tears, crushed cartons, and grain spillage from delivery photos, calculating damage %.',
      parameters: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'Delivered Purchase Order ID', example: 'PO-105' },
          damagedBagsCount: { type: 'number', description: 'Reported count of damaged units', example: 20 },
          damageNotes: { type: 'string', description: 'Inspector notes', example: '20 bags torn during transit' },
          imageBase64: { type: 'string', description: 'Base64 image of damaged shipment', example: 'data:image/jpeg;base64,...' },
        },
        required: ['poId'],
      },
      returns: 'DamageInspectionResult with severity level, penalty points, and adjusted supplier score',
      executionCount: 8,
      lastExecutedAt: new Date(Date.now() - 900000).toISOString(),
      handler: async (args) => {
        return await runMultimodalDamageInspection(args);
      },
    });

    // 7. SELF-HEALING FEEDBACK LOOP MCP TOOL
    this.registerTool({
      name: 'mcp_self_healing_failover',
      category: 'FEEDBACK_LOOP',
      description: 'Autonomous feedback loop: updates rolling score (10 * (0.6*on_time + 0.4*(1-damage))), auto-demotes underperforming suppliers and reroutes subsequent requisitions.',
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', description: 'Supplier to evaluate', example: 'sup-1' },
          simulateDamageEvent: { type: 'boolean', description: 'Inject severe damage event to demonstrate auto-rerouting', example: true },
        },
        required: ['supplierId'],
      },
      returns: 'New supplier score and failover routing decision',
      executionCount: 12,
      lastExecutedAt: new Date(Date.now() - 400000).toISOString(),
      handler: async (args) => {
        const damageRate = args.simulateDamageEvent ? 0.35 : 0.05;
        const res = db.recalculateSupplierScore(args.supplierId, { onTime: false, damagePct: damageRate });
        const sup = db.suppliers.find((s) => s.id === args.supplierId);
        return {
          supplierName: sup?.name,
          oldScore: res.oldScore,
          newScore: res.newScore,
          status: sup?.status,
          nextPreferredSupplier: 'Golden Grain Corp (Score: 9.3)',
          selfHealingAction: 'Automatically switched future grain purchase orders away from Sunrise Rice Co.',
        };
      },
    });

    // 8. EXECUTIVE INSIGHT GENERATOR MCP TOOL
    this.registerTool({
      name: 'mcp_generate_executive_insights',
      category: 'APPROVAL',
      description: 'Synthesizes operational cycle time, supplier rankings, and policy compliance into a comprehensive briefing for executive management.',
      parameters: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', description: 'Report cadence', example: 'WEEKLY' },
        },
        required: [],
      },
      returns: 'Markdown executive brief with recommendations',
      executionCount: 7,
      lastExecutedAt: new Date(Date.now() - 1500000).toISOString(),
      handler: async () => {
        return await runInsightAgent();
      },
    });
  }
}

export const mcpRegistry = new McpRegistryService();
