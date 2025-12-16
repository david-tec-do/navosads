"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import Image from "next/image";
import { PlusIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarToggle } from "./sidebar-toggle";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  
  if (!user) {
    return <></>;
  }

  return (
    <Sidebar className="group-data-[side=left]:border-r-0" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row items-center gap-3 group-data-[collapsible=icon]:hidden"
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                <Image
                  priority={true}
                  src="/images/logo_small.png"
                  alt="AI Assistant"
                  width={95}
                  height={32}
                />
              </span>
            </Link>

            <SidebarToggle />
            <Button
              variant="ghost"
              type="button"
              style={{
                background: "linear-gradient(355.87deg,#fff 3.48%,#fffc 96.76%)",
                borderRadius: "999px",
              }}
              className="h-8 border-1 p-1 md:h-fit md:p-2 group-data-[state=expanded]:hidden [&_svg]:size-4 cursor-pointer text-primary hover:text-primary"
              onClick={() => {
                setOpenMobile(false);
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
            </Button>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <Button
        variant="ghost"
        type="button"
        style={{
          background: "linear-gradient(355.87deg,#fff 3.48%,#fffc 96.76%)",
          borderRadius: "999px",
        }}
        className="h-8 border-1 mx-3 p-1 md:h-fit md:p-2 group-data-[collapsible=icon]:hidden [&_svg]:size-4 cursor-pointer text-primary hover:text-primary"
        onClick={() => {
          setOpenMobile(false);
          router.push("/");
          router.refresh();
        }}
      >
        <PlusIcon /> New Chat
      </Button>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
