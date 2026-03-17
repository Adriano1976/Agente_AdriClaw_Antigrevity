export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  // JSON Schema properties
  abstract parameters: Record<string, any>;

  abstract execute(args: Record<string, any>): Promise<any>;
}
