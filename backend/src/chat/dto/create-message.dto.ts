export class CreateMessageDto {
    content: string;
    role: 'user' | 'assistant' | 'system';
    conversationId: string;

}
/*
model Message {
  id             String   @id @default(cuid())
  content        String
  role           String
  createdAt      DateTime @default(now())

  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])

  @@map("messages")
}
*/