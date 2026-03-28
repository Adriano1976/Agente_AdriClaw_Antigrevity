import { globalToolRegistry } from './ToolRegistry';
import { DateTool } from './DateTool';
import { WebSearchTool } from './WebSearchTool';

// Registramos as tools ativas
globalToolRegistry.register(new DateTool());
globalToolRegistry.register(new WebSearchTool());

export { globalToolRegistry };