import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { currentUser } from "@/lib/ams-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const u = currentUser();
    navigate({ to: u ? "/dashboard" : "/login", replace: true });
  }, [navigate]);
  return null;
}
