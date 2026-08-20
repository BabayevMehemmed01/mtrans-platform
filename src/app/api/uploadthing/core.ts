import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  chatAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    pdf: { maxFileSize: "8MB" },
    video: { maxFileSize: "16MB" },
    text: { maxFileSize: "2MB" },
    audio: { maxFileSize: "8MB", maxFileCount: 4 },
    blob: { maxFileSize: "8MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),

  taskAttachment: f({ image: { maxFileSize: "4MB", maxFileCount: 4 }, pdf: { maxFileSize: "8MB" }, video: { maxFileSize: "16MB" }, text: { maxFileSize: "2MB" } })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task attachment upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
