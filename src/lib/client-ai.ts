"use client";

export type ClientAISettings = {
  model: string;
};

export async function getClientAISettings(settings: ClientAISettings) {
  return { model: settings.model };
}
