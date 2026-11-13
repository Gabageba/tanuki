import { AsyncLocalStorage } from 'node:async_hooks';
import { PARSER_CALL_CONTEXT, type ParserCallContext } from './models';

const STORAGE = new AsyncLocalStorage<ParserCallContext>();
export const getParserCallContext = () => STORAGE.getStore() ?? PARSER_CALL_CONTEXT.BACKGROUND;
export const runWithParserContext = <T>(context: ParserCallContext, task: () => T): T =>
  STORAGE.run(context, task);
