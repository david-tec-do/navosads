"use client";

import { type ComponentProps, memo } from "react";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const [defaultOrigin, setDefaultOrigin] = useState<string>("");

    useEffect(() => {
      if (typeof window !== "undefined") {
        setDefaultOrigin(window.location.origin);
      }
    }, []);

    return (
      <Streamdown
        allowedLinkPrefixes={["/"]}
        defaultOrigin={defaultOrigin}
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
          className
        )}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
