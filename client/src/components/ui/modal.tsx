import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden bg-card border-primary/20 rounded-2xl shadow-2xl max-w-2xl w-[95vw]",
          className
        )}
      >

        {/* --- STICKY HEADER --- */}
        <DialogHeader className="px-6 py-4 bg-[#eef6f1] dark:bg-primary/10 border-b border-primary/20 flex flex-row items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-full bg-white dark:bg-background border border-primary/30 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 py-6 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 bg-muted/40 border-t border-border flex justify-end gap-3 backdrop-blur-md">
            {footer}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}