"use client";

import { type ComponentProps, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Get origin at module level for client-side rendering
const getOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
};

const defaultOrigin = getOrigin();

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const router = useRouter();

    const CustomLink = useCallback(
      ({ href, ...anchorProps }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
        // Handle relative paths with client-side navigation
        if (href && href.startsWith("/")) {
          return (
            <a
              {...anchorProps}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                router.push(href);
              }}
            />
          );
        }
        // Handle external links normally
        return <a {...anchorProps} href={href} />;
      },
      [router]
    );

    return (
      <Streamdown
        allowedLinkPrefixes={["/"]}
        defaultOrigin={defaultOrigin}
        components={{
          a: CustomLink,
        }}
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
