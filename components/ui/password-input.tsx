"use client";

import { forwardRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../icons";
import { Input, type InputProps } from "./input";
import { Button } from "./button";

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={className}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 z-10 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <span className="h-4 w-4">
              <EyeIcon aria-hidden="true" />
            </span>
          ) : (
            <span className="h-4 w-4">
              <EyeOffIcon aria-hidden="true" />
            </span>
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

