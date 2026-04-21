"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const KEY_WELCOME_SEEN = "topic_spark_welcome_seen";
const KEY_ONBOARDING_STEP = "topic_spark_onboarding_step";
const KEY_ONBOARDING_DONE = "topic_spark_onboarding_done";

export type OnboardingPage = "home" | "topic";

export type OnboardingPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type OnboardingHighlightRadius = "full" | "2xl" | "xl" | "lg";

export type OnboardingHintModel = {
  step: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  primaryButtonText: string;
  showBack?: boolean;
  anchorSelector: string;
  placement: OnboardingPlacement;
  highlightRadius?: OnboardingHighlightRadius;
};

function readBool(key: string): boolean {
  return window.localStorage.getItem(key) === "true";
}

function readStep(): 1 | 2 | 3 | 4 | null {
  const raw = window.localStorage.getItem(KEY_ONBOARDING_STEP);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

function writeStep(step: 1 | 2 | 3 | 4 | null) {
  if (step === null) {
    window.localStorage.removeItem(KEY_ONBOARDING_STEP);
    return;
  }
  window.localStorage.setItem(KEY_ONBOARDING_STEP, String(step));
}

export function useOnboarding(opts: { page: OnboardingPage; enabled: boolean; hasTopics?: boolean }) {
  const { page, enabled, hasTopics } = opts;

  const [ready, setReady] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const welcomeSeen = readBool(KEY_WELCOME_SEEN);
    const done = readBool(KEY_ONBOARDING_DONE);
    const storedStep = readStep();

    setOnboardingDone(done);

    const shouldOpenWelcome = page === "home" && !welcomeSeen;
    setWelcomeOpen(shouldOpenWelcome);

    if (done) {
      setStep(null);
    } else {
      if (storedStep) {
        setStep(storedStep);
      } else if (page === "home" && welcomeSeen) {
        writeStep(1);
        setStep(1);
      } else {
        setStep(null);
      }
    }

    setReady(true);
  }, [enabled, page]);

  const closeWelcome = useCallback(() => {
    window.localStorage.setItem(KEY_WELCOME_SEEN, "true");
    setWelcomeOpen(false);

    const done = readBool(KEY_ONBOARDING_DONE);
    if (done) return;

    const cur = readStep();
    if (!cur) {
      writeStep(1);
      setStep(1);
    }
  }, []);

  const goPrev = useCallback(() => {
    const cur = readStep();
    if (!cur) return;
    const prev = (cur - 1) as 1 | 2 | 3;
    if (prev < 1) return;
    writeStep(prev);
    setStep(prev);
  }, []);

  const goNext = useCallback(() => {
    const cur = readStep();
    if (!cur) return;

    if (cur === 4) {
      window.localStorage.setItem(KEY_ONBOARDING_DONE, "true");
      window.localStorage.removeItem(KEY_ONBOARDING_STEP);
      setOnboardingDone(true);
      setStep(null);
      return;
    }

    const next = (cur + 1) as 2 | 3 | 4;
    writeStep(next);
    setStep(next);
  }, []);

  const hint: OnboardingHintModel | null = useMemo(() => {
    if (!ready) return null;
    if (welcomeOpen) return null;
    if (onboardingDone) return null;
    if (!step) return null;

    if (page === "home") {
      if (step === 1) {
        return {
          step: 1,
          showBack: false,
          title: "先记录一个灵感",
          description: "点击下方按钮，随手记录你最近的一个想法。",
          primaryButtonText: "继续",
          anchorSelector: '[data-onboarding="create-button"]',
          placement: "top",
          highlightRadius: "full",
        };
      }
      if (step === 2) {
        return {
          step: 2,
          showBack: true,
          title: "灵感沉淀在这里",
          description: "内容会沉淀在列表里，随时查看与整理。",
          primaryButtonText: "好的",
          anchorSelector:
            hasTopics === false ? '[data-onboarding="empty-state"]' : '[data-onboarding="topic-item-peek"]',
          placement: "top",
          highlightRadius: "2xl",
        };
      }
      if (step === 3) {
        return {
          step: 3,
          showBack: true,
          title: "进入详情继续完善",
          description: "点击任意一条内容去修改，让想法更清晰。",
          primaryButtonText: "我知道了",
          anchorSelector: '[data-onboarding-card-target="true"]',
          placement: "top",
          highlightRadius: "2xl",
        };
      }
      return null;
    }

    if (page === "topic") {
      if (step === 4) {
        return {
          step: 4,
          showBack: true,
          title: "一键生成大纲",
          description: "当方向逐渐清晰，快速生成笔记或视频大纲。",
          primaryButtonText: "马上体验",
          anchorSelector: '[data-onboarding="generate-outline"]',
          placement: "bottom",
          highlightRadius: "lg",
        };
      }
      return null;
    }

    return null;
  }, [onboardingDone, page, ready, step, welcomeOpen, hasTopics]);

  return {
    welcomeOpen,
    closeWelcome,
    hint,
    goPrev,
    goNext,
  };
}

/*
调试重置：
localStorage.removeItem("topic_spark_welcome_seen")
localStorage.removeItem("topic_spark_onboarding_step")
localStorage.removeItem("topic_spark_onboarding_done")
*/
