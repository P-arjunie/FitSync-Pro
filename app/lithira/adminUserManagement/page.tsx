'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/Components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/Components/ui/tooltip';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  address: string;
  bmi: number;
  contactNumber: string;
  currentWeight: number;
  height: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  membershipInfo: {
    plan: string;
    startDate: string;
  };
}

interface Trainer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  specialization: string;
  yearsOfExperience: string;
  preferredTrainingHours: string;
  certifications: string[];
  pricingPlan: string;
  phone: string;
  availability: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  address: string;
}

export default function AdminUserManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberRes, trainerRes] = await Promise.all([
          axios.get('/api/admin/members'),
          axios.get('/api/admin/trainers'),
        ]);
        setMembers(memberRes.data);
        setTrainers(trainerRes.data);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    fetchData();
  }, []);

  const handleViewDetails = (id: string, role: 'member' | 'trainer') => {
    const basePath = role === 'member' ? '/lithira/memberdetails' : '/lithira/trainerdetails';
    router.push(`${basePath}?id=${id}`);
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
          </TabsList>

          {/* Members Table */}
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
  {members.map((member) => (
    <TableRow key={member._id}>
      <TableCell>
        <Button variant="link" onClick={() => handleViewDetails(member._id, 'member')}>
          {member.firstName} {member.lastName}
        </Button>
      </TableCell>
      <TableCell>{member.email}</TableCell>
      <TableCell>{member.dob}</TableCell>
      <TableCell>{member.gender}</TableCell>
      <TableCell>{member.address}</TableCell>
      <TableCell>{member.contactNumber}</TableCell>
      <TableCell>{member.height}</TableCell>
      <TableCell>{member.currentWeight}</TableCell>
      <TableCell>{member.bmi}</TableCell>
      <TableCell>
        {member.membershipInfo?.plan || 'N/A'}
      </TableCell>
      <TableCell>
        {member.membershipInfo?.startDate || 'N/A'}
      </TableCell>
      <TableCell>
        {member.emergencyContact
          ? `${member.emergencyContact.name} (${member.emergencyContact.relationship}) - ${member.emergencyContact.phone}`
          : 'N/A'}
      </TableCell>
      <TableCell>
        <Button variant="outline" onClick={() => handleViewDetails(member._id, 'member')}>
          View
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

    </Table>
  </div>
</TabsContent>


          {/* Trainers Table */}
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
                  {trainers.map((trainer) => (
                    <TableRow key={trainer._id}>
                      <TableCell>
                        <Button variant="link" onClick={() => handleViewDetails(trainer._id, 'trainer')}>
                          {trainer.firstName} {trainer.lastName}
                        </Button>
                      </TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.dob}</TableCell>
                      <TableCell>{trainer.gender}</TableCell>
                      <TableCell>{trainer.address}</TableCell>
                      <TableCell>{trainer.specialization}</TableCell>
                      <TableCell>{trainer.yearsOfExperience}</TableCell>
                      <TableCell>{trainer.preferredTrainingHours}</TableCell>
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
                      <TableCell>{trainer.pricingPlan}</TableCell>
                      <TableCell>{trainer.phone}</TableCell>
                      <TableCell>{trainer.availability}</TableCell>
                      <TableCell>
                        {trainer.emergencyName && trainer.relationship && trainer.emergencyPhone
                          ? `${trainer.emergencyName} (${trainer.relationship}) - ${trainer.emergencyPhone}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" onClick={() => handleViewDetails(trainer._id, 'trainer')}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
