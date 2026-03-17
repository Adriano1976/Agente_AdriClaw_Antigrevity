import { globalToolRegistry } from './ToolRegistry';
import { DateTool } from './DateTool';

// Registramos as tools ativas
globalToolRegistry.register(new DateTool());

export { globalToolRegistry };
