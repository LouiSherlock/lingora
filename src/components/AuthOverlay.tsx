"use client";

import { useEffect, useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { setToken } from "@/lib/auth-client";

export function AuthOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const openLogin = () => {
      setCode("");
      setError("");
      setIsOpen(true);
    };
    const expired = () => {
      setCode("");
      setError("登录已过期，请重新登录。");
      setIsOpen(true);
    };

    window.addEventListener("auth:login", openLogin);
    window.addEventListener("auth:expired", expired);
    return () => {
      window.removeEventListener("auth:login", openLogin);
      window.removeEventListener("auth:expired", expired);
    };
  }, []);

  async function submit(value: string) {
    if (submitting.current || value.length !== 6) return;
    submitting.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data: { token?: string; message?: string } = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message ?? "登录失败，请重试。");
      }
      setToken(data.token);
      setCode("");
      setIsOpen(false);
      window.dispatchEvent(new Event("auth:success"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败，请重试。");
      setCode("");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (loading && !open) return;
    setIsOpen(open);
    if (!open) {
      setCode("");
      setError("");
      window.dispatchEvent(new Event("auth:cancel"));
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      purpose="form"
      aria-label="登录"
    >
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>请输入登录码</Heading>
          <Text>输入 6 位数字验证码以继续使用 Lingora。</Text>
        </VStack>
        <HStack hAlign="center">
          <InputOTP
            aria-label="6 位登录验证码"
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            pattern={"\\d*"}
            maxLength={6}
            value={code}
            onChange={(value) => {
              const digits = value.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
              setError("");
            }}
            onComplete={submit}
            disabled={loading}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </HStack>
        {error ? <Banner status="error" title={error} /> : null}
        <HStack gap={2} hAlign="end">
          <Button
            label="取消"
            variant="ghost"
            isDisabled={loading}
            onClick={() => handleOpenChange(false)}
          />

        </HStack>
      </VStack>
    </Dialog>
  );
}
