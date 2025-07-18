"use client";

import { IApprovedTrainer } from "@/models/ApprovedTrainer";
import { IMember } from "@/models/member";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/Components/ui/tooltip";
import { Input } from "@/Components/ui/input";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Badge } from "@/Components/ui/badge";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

export default function AdminUserManagement() {
  // State hooks for managing members, trainers, search, editing, and form data
  const [members, setMembers] = useState<IMember[]>([]);
  const [trainers, setTrainers] = useState<IApprovedTrainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "all" | "approved" | "suspended"
  >("all");
  const [trainerStatusFilter, setTrainerStatusFilter] = useState<
    "all" | "approved" | "suspended"
  >("all");
  const router = useRouter();

  // Load members and trainers when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberRes, trainerRes] = await Promise.all([
          axios.get("/api/admin/members"),
          axios.get("/api/admin/trainers"),
        ]);
        setMembers(memberRes.data);
        setTrainers(trainerRes.data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchData();
  }, []);

  // Start editing mode for selected user
  const startEditing = (user: any) => {
    setEditingId(String(user._id));
    setEditedData(user);
  };

  const saveEdit = async (role: "member" | "trainer") => {
    try {
      await axios.put(`/api/admin/edit`, { role, data: editedData });
      setEditingId(null);
      if (role === "member") {
        setMembers((prev) =>
          prev.map((m) =>
            String(m._id) === String(editedData._id) ? editedData : m
          )
        );
      } else {
        setTrainers((prev) =>
          prev.map((t) =>
            String(t._id) === String(editedData._id) ? editedData : t
          )
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Handle changes in editable input fields
  const handleInputChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleViewDetails = (id: string, role: "member" | "trainer") => {
    const basePath =
      role === "member" ? "/lithira/memberdetails" : "/lithira/trainerdetails";
    router.push(`${basePath}?id=${id}`);
  };

  const handleSuspend = async (id: string, role: "member" | "trainer") => {
    try {
      await axios.put(`/api/admin/suspend`, { id, role });
      if (role === "member") {
        setMembers((prev) =>
          prev.map((m) => {
            if (String(m._id) === id) {
              (m as any).status = "suspended";
            }
            return m;
          })
        );
      } else {
        setTrainers((prev) =>
          prev.map((t) => {
            if (String(t._id) === id) {
              (t as any).status = "suspended";
            }
            return t;
          })
        );
      }
      alert(`User ${id} has been suspended.`);
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleUnsuspend = async (id: string, role: "member" | "trainer") => {
    try {
      await axios.put(`/api/admin/unsuspend`, { id, role });
      if (role === "member") {
        setMembers((prev) =>
          prev.map((m) => {
            if (String(m._id) === id) {
              (m as any).status = "approved";
            }
            return m;
          })
        );
      } else {
        setTrainers((prev) =>
          prev.map((t) => {
            if (String(t._id) === id) {
              (t as any).status = "approved";
            }
            return t;
          })
        );
      }
      alert(`User ${id} has been unsuspended.`);
    } catch (error) {
      console.error("Error unsuspending user:", error);
    }
  };

  const handleRemove = async (id: string, role: "member" | "trainer") => {
    try {
      await axios.delete(`/api/admin/remove`, { data: { id, role } });
      if (role === "member")
        setMembers((prev) => prev.filter((m) => String(m._id) !== id));
      else setTrainers((prev) => prev.filter((t) => String(t._id) !== id));
      alert(`User ${id} has been removed.`);
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("profileImage");
    window.location.href = "/";
  };

  // Filter members based on status and search term
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      memberStatusFilter === "all" ||
      (member as any).status === memberStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter trainers based on status and search term
  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch =
      `${trainer.firstName} ${trainer.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      trainerStatusFilter === "all" ||
      (trainer as any).status === trainerStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const renderActions = (user: any, role: "member" | "trainer") => {
    const id = String(user._id);
    const isSuspended = (user as any).status === "suspended";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {editingId === id ? (
            <DropdownMenuItem onClick={() => saveEdit(role)}>
              Save
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => startEditing(user)}>
              Edit
            </DropdownMenuItem>
          )}

          {isSuspended ? (
            <DropdownMenuItem onClick={() => handleUnsuspend(id, role)}>
              Unsuspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleSuspend(id, role)}>
              Suspend
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => handleRemove(id, role)}>
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Render an editable input cell
  const editableCell = (field: string, value: any) => (
    <Input
      value={editedData[field] || ""}
      onChange={(e) => handleInputChange(field, e.target.value)}
    />
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gray-800">
        <Navbar />
        <div className="flex-1 p-8">
          <div className="max-w-[98vw] w-full mx-auto space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-extrabold text-red-600 drop-shadow">
                User Management
              </h1>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search members/trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 bg-white text-black border border-gray-300 rounded-lg shadow-sm focus:border-red-600 focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="bg-gray-100 border-b border-red-600 rounded-t-xl">
                  <TabsTrigger
                    value="members"
                    className="text-gray-800 data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-t-xl px-6 py-2 font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    Members
                  </TabsTrigger>
                  <TabsTrigger
                    value="trainers"
                    className="text-gray-800 data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-t-xl px-6 py-2 font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    Trainers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="members">
                  <div>
                    {/* Member Status Filter */}
                    <div className="mb-4 flex gap-2">
                      <Button
                        variant={
                          memberStatusFilter === "all" ? "default" : "outline"
                        }
                        onClick={() => setMemberStatusFilter("all")}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        All Members ({members.length})
                      </Button>
                      <Button
                        variant={
                          memberStatusFilter === "approved"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setMemberStatusFilter("approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Active (
                        {
                          members.filter(
                            (m) => (m as any).status === "approved"
                          ).length
                        }
                        )
                      </Button>
                      <Button
                        variant={
                          memberStatusFilter === "suspended"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setMemberStatusFilter("suspended")}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Suspended (
                        {
                          members.filter(
                            (m) => (m as any).status === "suspended"
                          ).length
                        }
                        )
                      </Button>
                    </div>

                    <div className="w-full">
                      <Table className="w-full bg-white text-gray-900 rounded-b-xl text-sm">
                        <TableHeader className="bg-gray-100 text-red-600">
                          <TableRow>
                            <TableHead className="text-red-600">
                              Full Name
                            </TableHead>
                            <TableHead className="text-red-600">
                              Email
                            </TableHead>
                            <TableHead className="text-red-600">
                              Status
                            </TableHead>
                            <TableHead className="text-red-600">DOB</TableHead>
                            <TableHead className="text-red-600">
                              Gender
                            </TableHead>
                            <TableHead className="text-red-600">
                              Address
                            </TableHead>
                            <TableHead className="text-red-600">
                              Contact Number
                            </TableHead>
                            <TableHead className="text-red-600">
                              Height (cm)
                            </TableHead>
                            <TableHead className="text-red-600">
                              Weight (kg)
                            </TableHead>
                            <TableHead className="text-red-600">BMI</TableHead>
                            <TableHead className="text-red-600">
                              Membership Type
                            </TableHead>
                            <TableHead className="text-red-600">
                              Start Date
                            </TableHead>
                            <TableHead className="text-red-600">
                              Emergency Contact
                            </TableHead>
                            <TableHead className="text-red-600">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member) => {
                            const isEditing = editingId === String(member._id);
                            const isSuspended =
                              (member as any).status === "suspended";

                            return (
                              <TableRow
                                key={String(member._id)}
                                className={isSuspended ? "bg-red-50" : ""}
                              >
                                <TableCell>
                                  {isEditing ? (
                                    <span
                                      className={
                                        isSuspended
                                          ? "text-red-600"
                                          : "text-gray-900"
                                      }
                                    >
                                      {`${editedData.firstName || ""} ${
                                        editedData.lastName || ""
                                      }`}
                                    </span>
                                  ) : (
                                    <Button
                                      variant="link"
                                      onClick={() =>
                                        handleViewDetails(
                                          String(member._id),
                                          "member"
                                        )
                                      }
                                      className={
                                        isSuspended
                                          ? "text-red-600 hover:text-red-700"
                                          : "text-gray-900 hover:text-red-600 focus:ring-2 focus:ring-red-600 focus:outline-none"
                                      }
                                    >
                                      {member.firstName} {member.lastName}
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("email", member.email)
                                    : member.email}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(
                                    (member as any).status || "approved"
                                  )}
                                </TableCell>
                                <TableCell>{member.dob}</TableCell>
                                <TableCell>{member.gender}</TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("address", member.address)
                                    : member.address}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "contactNumber",
                                        member.contactNumber
                                      )
                                    : member.contactNumber}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("height", member.height)
                                    : member.height}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "currentWeight",
                                        member.currentWeight
                                      )
                                    : member.currentWeight}
                                </TableCell>
                                <TableCell>{member.bmi}</TableCell>
                                <TableCell>
                                  {member.membershipInfo?.plan || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {member.membershipInfo?.startDate || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {member.emergencyContact
                                    ? `${member.emergencyContact.name} (${member.emergencyContact.relationship}) - ${member.emergencyContact.phone}`
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {renderActions(member, "member")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="trainers">
                  <div>
                    {/* Trainer Status Filter */}
                    <div className="mb-4 flex gap-2">
                      <Button
                        variant={
                          trainerStatusFilter === "all" ? "default" : "outline"
                        }
                        onClick={() => setTrainerStatusFilter("all")}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        All Trainers ({trainers.length})
                      </Button>
                      <Button
                        variant={
                          trainerStatusFilter === "approved"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setTrainerStatusFilter("approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Active (
                        {
                          trainers.filter(
                            (t) => (t as any).status === "approved"
                          ).length
                        }
                        )
                      </Button>
                      <Button
                        variant={
                          trainerStatusFilter === "suspended"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setTrainerStatusFilter("suspended")}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Suspended (
                        {
                          trainers.filter(
                            (t) => (t as any).status === "suspended"
                          ).length
                        }
                        )
                      </Button>
                    </div>

                    <div className="overflow-auto rounded-b-xl">
                      <Table className="min-w-[1700px] bg-white text-gray-900 rounded-b-xl">
                        <TableHeader className="bg-gray-100 text-red-600">
                          <TableRow>
                            <TableHead className="text-red-600">
                              Full Name
                            </TableHead>
                            <TableHead className="text-red-600">
                              Email
                            </TableHead>
                            <TableHead className="text-red-600">
                              Status
                            </TableHead>
                            <TableHead className="text-red-600">DOB</TableHead>
                            <TableHead className="text-red-600">
                              Gender
                            </TableHead>
                            <TableHead className="text-red-600">
                              Address
                            </TableHead>
                            <TableHead className="text-red-600">
                              Specialization
                            </TableHead>
                            <TableHead className="text-red-600">
                              Years of Experience
                            </TableHead>
                            <TableHead className="text-red-600">
                              Preferred Hours
                            </TableHead>
                            <TableHead className="text-red-600">
                              Certifications
                            </TableHead>
                            <TableHead className="text-red-600">
                              Pricing
                            </TableHead>
                            <TableHead className="text-red-600">
                              Phone
                            </TableHead>
                            <TableHead className="text-red-600">
                              Availability
                            </TableHead>
                            <TableHead className="text-red-600">
                              Emergency Contact
                            </TableHead>
                            <TableHead className="text-red-600">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrainers.map((trainer) => {
                            const isEditing = editingId === String(trainer._id);
                            const isSuspended =
                              (trainer as any).status === "suspended";

                            return (
                              <TableRow
                                key={String(trainer._id)}
                                className={isSuspended ? "bg-red-50" : ""}
                              >
                                <TableCell>
                                  {isEditing ? (
                                    <span
                                      className={
                                        isSuspended
                                          ? "text-red-600"
                                          : "text-gray-900"
                                      }
                                    >
                                      {`${editedData.firstName || ""} ${
                                        editedData.lastName || ""
                                      }`}
                                    </span>
                                  ) : (
                                    <Button
                                      variant="link"
                                      onClick={() =>
                                        handleViewDetails(
                                          String(trainer._id),
                                          "trainer"
                                        )
                                      }
                                      className={
                                        isSuspended
                                          ? "text-red-600 hover:text-red-700"
                                          : "text-gray-900 hover:text-red-600"
                                      }
                                    >
                                      {trainer.firstName} {trainer.lastName}
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("email", trainer.email)
                                    : trainer.email}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(
                                    (trainer as any).status || "approved"
                                  )}
                                </TableCell>
                                <TableCell>{trainer.dob}</TableCell>
                                <TableCell>{trainer.gender}</TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("address", trainer.address)
                                    : trainer.address}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "specialization",
                                        trainer.specialization
                                      )
                                    : trainer.specialization}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "yearsOfExperience",
                                        trainer.yearsOfExperience
                                      )
                                    : trainer.yearsOfExperience}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "preferredTrainingHours",
                                        trainer.preferredTrainingHours
                                      )
                                    : trainer.preferredTrainingHours}
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="underline cursor-help text-gray-900">
                                        {trainer.certifications?.length || 0}{" "}
                                        certs
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {trainer.certifications?.map((c, i) => (
                                        <div key={i}>{c}</div>
                                      ))}
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "pricingPlan",
                                        trainer.pricingPlan
                                      )
                                    : trainer.pricingPlan}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell("phone", trainer.phone)
                                    : trainer.phone}
                                </TableCell>
                                <TableCell>
                                  {isEditing
                                    ? editableCell(
                                        "availability",
                                        trainer.availability
                                      )
                                    : trainer.availability}
                                </TableCell>
                                <TableCell>
                                  {trainer.emergencyContact?.name &&
                                  trainer.emergencyContact?.relationship &&
                                  trainer.emergencyContact?.phone
                                    ? `${trainer.emergencyContact.name} (${trainer.emergencyContact.relationship}) - ${trainer.emergencyContact.phone}`
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {renderActions(trainer, "trainer")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        <Footer1 />
      </div>
    </TooltipProvider>
  );
}
