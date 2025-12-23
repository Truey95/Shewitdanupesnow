import { useToast } from "@/hooks/use-toast";

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: unknown, title: string = "Error") => {
    console.error(title, error);
    
    let message = "An unexpected error occurred";
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message;
    }

    toast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  const handleSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  };

  return { handleError, handleSuccess };
}