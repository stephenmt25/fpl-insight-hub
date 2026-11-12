import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!bg-popover !text-foreground !border-border !rounded-none font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
