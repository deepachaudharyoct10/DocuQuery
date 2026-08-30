import { ConversationModel } from "../models/conversation.model";
import { embedText } from "./embedding.service";
import { generateAnswer, type ChatHistoryItem, type Citation } from "./generation.service";
import { searchSimilarChunks, type SimilarChunk } from "./vector.service";

const TOP_K = 5;
const HISTORY_WINDOW = 6;

export interface AskQuestionResult {
  conversationId: string;
  answer: string;
  citations: Citation[];
  retrievedChunks: SimilarChunk[];
}

export async function askQuestion(question: string, conversationId?: string): Promise<AskQuestionResult> {
  let conversation = conversationId ? await ConversationModel.findById(conversationId) : null;

  if (!conversation) {
    conversation = await ConversationModel.create({ title: question.slice(0, 60) });
  }

  const history: ChatHistoryItem[] = conversation.messages.slice(-HISTORY_WINDOW).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const queryVector = await embedText(question);
  const retrievedChunks = await searchSimilarChunks(queryVector, TOP_K);

  const { answer, citations } = await generateAnswer(question, retrievedChunks, history);

  conversation.messages.push({ role: "user", content: question, citations: [] });
  conversation.messages.push({ role: "assistant", content: answer, citations });
  await conversation.save();

  return {
    conversationId: conversation.id,
    answer,
    citations,
    retrievedChunks,
  };
}
