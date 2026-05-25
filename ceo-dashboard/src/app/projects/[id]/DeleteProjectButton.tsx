"use client";

import { useTransition } from "react";
import { deleteProject } from "../actions";

export function DeleteProjectButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `プロジェクト「${name}」を削除します。\n\n紐づくタスク・更新履歴は一緒に削除されます。\n判断・リスクは残ります(プロジェクト紐付けが解除されるだけ)。\n\nよろしいですか?`,
          )
        )
          return;
        start(async () => {
          await deleteProject(id);
        });
      }}
      className="btn-danger text-[12px]"
    >
      {pending ? "削除中…" : "プロジェクトを削除"}
    </button>
  );
}
