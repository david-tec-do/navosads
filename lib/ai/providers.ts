import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // 使用 OpenAI GPT-5 模型（根据 AI Gateway 文档示例）
        "chat-model": gateway.languageModel("openai/gpt-5"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("openai/gpt-5"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("openai/gpt-5"),
        "artifact-model": gateway.languageModel("openai/gpt-5"),
      },
    });
