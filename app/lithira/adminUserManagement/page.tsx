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
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

export default function AdminUserManagement() {
  // State hooks for managing members, trainers, search, editing, and form data
  const [members, setMembers] = useState<IMember[]>([]);
  const [trainers, setTrainers] = useState<IApprovedTrainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({});
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

<<<<<<< Updated upstream
  // Save the edited user data to the backend
  const saveEdit = async (role: 'member' | 'trainer') => {
    try {
      await axios.put(`/api/admin/edit`, { role, data: editedData });
      setEditingId(null);
      if (role === 'member') {
        // Update local state after saving
        setMembers(prev => prev.map(m => String(m._id) === String(editedData._id) ? editedData : m));
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // Navigate to full detail view for a user
  const handleViewDetails = (id: string, role: 'member' | 'trainer') => {
    const basePath = role === 'member' ? '/lithira/memberdetails' : '/lithira/trainerdetails';
    router.push(`${basePath}?id=${id}`);
  };

  // Suspend user
  const handleSuspend = async (id: string, role: 'member' | 'trainer') => {
    try {
      await axios.put(`/api/admin/suspend`, { id, role });
=======
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
>>>>>>> Stashed changes
      alert(`User ${id} has been suspended.`);
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

<<<<<<< Updated upstream
  // Remove user
  const handleRemove = async (id: string, role: 'member' | 'trainer') => {
=======
  const handleUnsuspend = async (id: string, role: "member" | "trainer") => {
    try {
      await axios.put(`/api/admin/unsuspend`, { id, role });
      if (role === "member") {
        setMembers((prev) =>
          prev.map((m) => {
            if (String(m._id) === id) {
              (m as any).status = "active";
            }
            return m;
          })
        );
      } else {
        setTrainers((prev) =>
          prev.map((t) => {
            if (String(t._id) === id) {
              (t as any).status = "active";
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // Filter users based on search term
  const filteredMembers = members.filter((member) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
=======
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("profileImage");
    window.location.href = "/";
  };

  const filteredMembers = members.filter(
    (member) =>
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
>>>>>>> Stashed changes
  );

  const filteredTrainers = trainers.filter(
    (trainer) =>
      `${trainer.firstName} ${trainer.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

<<<<<<< Updated upstream
  // Render dropdown menu actions (Edit/Save/View/Suspend/Remove)
  const renderActions = (user: any, role: 'member' | 'trainer') => {
    const id = String(user._id);
=======
  const renderActions = (user: any, role: "member" | "trainer") => {
    const id = String(user._id);
    const isSuspended = (user as any).status === "suspended";

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          <DropdownMenuItem onClick={() => handleViewDetails(id, role)}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSuspend(id, role)}>Suspend</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRemove(id, role)}>Remove</DropdownMenuItem>
=======

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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <div className="p-6 space-y-6">
        {/* Header and search input */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Input
            placeholder="Search members/trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
        </div>

        {/* Tab system for switching between members and trainers */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
          </TabsList>

          {/* Members table */}
          <TabsContent value="members">
            <div className="overflow-auto">
              <Table className="min-w-[1500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Height (cm)</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>BMI</TableHead>
                    <TableHead>Membership Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Emergency Contact</TableHead>
                    <TableHead>Action</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const isEditing = editingId === String(member._id);
                    return (
                      <TableRow key={String(member._id)}>
                        {/* Editable full name */}
                        <TableCell>
                          {isEditing ? (
                            `${editedData.firstName || ''} ${editedData.lastName || ''}`
                          ) : (
                            <Button variant="link" onClick={() => handleViewDetails(String(member._id), 'member')}>
                              {member.firstName} {member.lastName}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{isEditing ? editableCell('email', member.email) : member.email}</TableCell>
                        <TableCell>{member.dob}</TableCell>
                        <TableCell>{member.gender}</TableCell>
                        <TableCell>{isEditing ? editableCell('address', member.address) : member.address}</TableCell>
                        <TableCell>{isEditing ? editableCell('contactNumber', member.contactNumber) : member.contactNumber}</TableCell>
                        <TableCell>{isEditing ? editableCell('height', member.height) : member.height}</TableCell>
                        <TableCell>{isEditing ? editableCell('currentWeight', member.currentWeight) : member.currentWeight}</TableCell>
                        <TableCell>{member.bmi}</TableCell>
                        <TableCell>{member.membershipInfo?.plan || 'N/A'}</TableCell>
                        <TableCell>{member.membershipInfo?.startDate || 'N/A'}</TableCell>
                        <TableCell>
                          {member.emergencyContact
                            ? `${member.emergencyContact.name} (${member.emergencyContact.relationship}) - ${member.emergencyContact.phone}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{renderActions(member, 'member')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Trainers table (continued in your original code) */}


          <TabsContent value="trainers">
            <div className="overflow-auto">
              <Table className="min-w-[1700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Years of Experience</TableHead>
                    <TableHead>Preferred Hours</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Emergency Contact</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainers.map((trainer) => {
                    const isEditing = editingId === String(trainer._id);
                    return (
                      <TableRow key={String(trainer._id)}>
                        <TableCell>
                          {isEditing ? (
                            `${editedData.firstName || ''} ${editedData.lastName || ''}`
                          ) : (
                            <Button variant="link" onClick={() => handleViewDetails(String(trainer._id), 'trainer')}>
                              {trainer.firstName} {trainer.lastName}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{isEditing ? editableCell('email', trainer.email) : trainer.email}</TableCell>
                        <TableCell>{trainer.dob}</TableCell>
                        <TableCell>{trainer.gender}</TableCell>
                        <TableCell>{isEditing ? editableCell('address', trainer.address) : trainer.address}</TableCell>
                        <TableCell>{isEditing ? editableCell('specialization', trainer.specialization) : trainer.specialization}</TableCell>
                        <TableCell>{isEditing ? editableCell('yearsOfExperience', trainer.yearsOfExperience) : trainer.yearsOfExperience}</TableCell>
                        <TableCell>{isEditing ? editableCell('preferredTrainingHours', trainer.preferredTrainingHours) : trainer.preferredTrainingHours}</TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="underline cursor-help">
                                {trainer.certifications?.length || 0} certs
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {trainer.certifications?.map((c, i) => (
                                <div key={i}>{c}</div>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{isEditing ? editableCell('pricingPlan', trainer.pricingPlan) : trainer.pricingPlan}</TableCell>
                        <TableCell>{isEditing ? editableCell('phone', trainer.phone) : trainer.phone}</TableCell>
                        <TableCell>{isEditing ? editableCell('availability', trainer.availability) : trainer.availability}</TableCell>
                        <TableCell>
                          {trainer.emergencyName && trainer.relationship && trainer.emergencyPhone
                            ? `${trainer.emergencyName} (${trainer.relationship}) - ${trainer.emergencyPhone}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{renderActions(trainer, 'trainer')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
=======
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
                                  {trainer.emergencyName &&
                                  trainer.relationship &&
                                  trainer.emergencyPhone
                                    ? `${trainer.emergencyName} (${trainer.relationship}) - ${trainer.emergencyPhone}`
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
>>>>>>> Stashed changes
      </div>
    </TooltipProvider>
  );
}
