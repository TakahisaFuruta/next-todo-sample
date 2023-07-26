import axios from "axios";
import React from "react";
import { Layout } from "@/components/Layout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { LogoutIcon } from "@heroicons/react/solid";
import { UserInfo } from "@/components/UseInfo";
import { useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";

const Dashboard: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    queryClient.removeQueries(["user"]);
    queryClient.removeQueries(["tasks"]);
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`);
    router.push("/");
  };

  return (
    <Layout title="Task Board">
      <LogoutIcon
        className="mb-6 h-6 w-6 cursor-pointer text-blue-500"
        onClick={logout}
      />
      <UserInfo />
      <TaskForm />
      <TaskList />
    </Layout>
  );
};

export default Dashboard;
