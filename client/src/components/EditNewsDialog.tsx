
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNews } from "@/hooks/use-news";
import { Pencil, ImagePlus, Loader2 } from "lucide-react";
import type { News } from "@db/schema";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditNewsDialogProps {
  news: News;
  teamId: number;
}

export function EditNewsDialog({ news, teamId }: EditNewsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string>(news.imageUrl || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { updateNews } = useNews(teamId);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl || "",
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { photoUrl } = await response.json();
      form.setValue('imageUrl', photoUrl);
      setPreviewUrl(photoUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await updateNews({
        id: news.id,
        ...data,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update news:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit News Article</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      {previewUrl && (
                        <div className="relative max-h-[200px] overflow-hidden rounded-lg">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <Input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end sticky bottom-0 pt-4 mt-4 border-t bg-background">
              <Button type="submit">Update News</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
