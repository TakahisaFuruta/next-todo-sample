import Head from "next/head";
import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};
export const Layout: React.FC<Props> = ({ children, title = "NextJs" }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{title}</title>
      </Head>
      <main className="flex w-screen flex-1 flex-col items-center justify-center">
        {children}
      </main>
    </div>
  );
};
