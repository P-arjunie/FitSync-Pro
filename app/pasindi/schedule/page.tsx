"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";
import SessionForm from "../components/session-form";
import SessionCalendar from "../components/session-calendar";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    console.log("userRole from localStorage:", userRole);
    setRole(userRole ? userRole.toLowerCase() : null);
    setChecked(true);
  }, []);

  useEffect(() => {
    console.log("Checked:", checked, "Role:", role);
    if (checked && role !== "trainer") {
      router.replace("/"); // Redirect to home or login if not a trainer
    }
  }, [checked, role, router]);

  if (!checked) return null; // Wait for role check

  if (role !== "trainer") {
    return <div className="text-center text-red-600 mt-10">Access denied. Trainers only.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gym Session Scheduler</h1>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Session</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-0">
          <SessionCalendar />
        </TabsContent>
        <TabsContent value="schedule" className="mt-0">
          <SessionForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
