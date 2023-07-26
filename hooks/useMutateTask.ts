import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import useStore from "../store";
import { EditedTask } from "@/types";
import axios from "axios";
import { Task } from "@prisma/client";

export const useMutateTask = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const reset = useStore((state) => state.resetEditedTask);

  const createTaskMutation = useMutation(
    async (task: Omit<EditedTask, "id">) => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/todo`,
        task
      );
      return res.data;
    },
    {
      onSuccess: (res) => {
        // cacheの更新
        const previous = queryClient.getQueryData<Task[]>(["tasks"]);
        if (previous) {
          queryClient.setQueryData(["tasks"], [res, ...previous]);
        }
        reset();
      },
      onError: (err: any) => {
        reset();
        if (err.response.status === 401 || err.response.status === 403) {
          router.push("/");
        }
      },
    }
  );

  const updateTaskMutation = useMutation(
    async (task: EditedTask) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/todo/${task.id}`,
        task
      );
      return res.data;
    },
    {
      onSuccess: (res, vars) => {
        const previous = queryClient.getQueryData<Task[]>(["tasks"]);
        if (previous) {
          queryClient.setQueryData(
            ["tasks"],
            previous.map((t) => (t.id === res.id ? res : t))
          );
        }
        reset();
      },
      onError: (err: any) => {
        reset();
        if (err.response.status === 401 || err.response.status === 403) {
          router.push("/");
        }
      },
    }
  );

  const deleteTaskMutation = useMutation(
    async (id: number) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/todo/${id}`);
    },
    {
      onSuccess: (_, vars) => {
        const previous = queryClient.getQueryData<Task[]>(["tasks"]);
        if (previous) {
          queryClient.setQueryData(
            ["tasks"],
            previous.filter((t) => t.id !== vars)
          );
        }
        reset();
      },
      onError: (err: any) => {
        reset();
        if (err.response.status === 401 || err.response.status === 403) {
          router.push("/");
        }
      },
    }
  );

  return { createTaskMutation, updateTaskMutation, deleteTaskMutation };
};
