"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Badge } from "../../Components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";
import { Button } from "../../Components/ui/button";
import { Progress } from "../../Components/ui/progress";
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Star,
  Video,
  Dumbbell,
  DollarSign,
  Target,
  Award,
  MessageSquare,
  Phone,
  Mail,
  Timer,
  Zap,
  Eye,
  Calendar as CalendarIcon,
  ChevronRight,
  User,
  TrendingDown
} from "lucide-react";
import moment from "moment";

interface Session {
  _id: string;
  title: string;
  trainerName: string;
  start: string;
  end: string;
  location: string;
  maxParticipants: number;
  currentParticipants?: number;
  description?: string;
  canceled?: boolean;
  cancellationReason?: string;
  status?: 'active' | 'cancelled' | 'completed';
  type?: 'physical' | 'virtual';
}

interface Participant {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  joinedAt: string;
  sessionCount?: number;
}

const TrainerDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; role: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const [virtualSessions, setVirtualSessions] = useState<any[]>([]);
  const [trainerPricingPlans, setTrainerPricingPlans] = useState<string[]>([]);
  const [trainerEmail, setTrainerEmail] = useState<string>("");

  useEffect(() => {
    // Get trainer info from localStorage
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    const name = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
    if (userId && role === "trainer") {
      setUser({ userId, role, name: name || "" });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch sessions
        const sessionsResponse = await fetch(`/api/sessions?trainerId=${user.userId}`);
        if (!sessionsResponse.ok) throw new Error("Failed to fetch sessions");
        const sessionsData = await sessionsResponse.json();
        
        if (isMounted) {
          setSessions(sessionsData);
          
          // Fetch participants for all sessions
          let participantsArr: Participant[] = [];
          for (const session of sessionsData) {
            try {
              const participantsResponse = await fetch(`/api/sessions/${session._id}/participants`);
              if (participantsResponse.ok) {
                const participantsData = await participantsResponse.json();
                const participants = Array.isArray(participantsData) ? participantsData : participantsData.all || [];
                participantsArr = participantsArr.concat(participants);
              }
            } catch (error) {
              console.error(`Failed to fetch participants for session ${session._id}:`, error);
            }
          }
          setAllParticipants(participantsArr);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setSessions([]);
          setAllParticipants([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [user]);

  // Fetch trainer email and pricingPlans
  useEffect(() => {
    if (!user || !user.userId) return;
    fetch(`/api/approved-trainer/${user.userId}`)
      .then(res => res.json())
      .then(data => {
        setTrainerPricingPlans(Array.isArray(data.pricingPlans) ? data.pricingPlans : []);
        setTrainerEmail(data.email || "");
      });
  }, [user]);

  // Fetch virtual sessions using trainerEmail
  useEffect(() => {
    if (!trainerEmail) return;
    fetch(`/api/virtual-sessions?trainerEmail=${encodeURIComponent(trainerEmail)}`)
      .then(res => res.json())
      .then(data => {
        setVirtualSessions(Array.isArray(data) ? data : data.sessions || []);
      });
  }, [trainerEmail]);

  // Enhanced dashboard metrics with more meaningful calculations
  const dashboardMetrics = useMemo(() => {
    const now = moment();
    const today = now.clone().startOf('day');
    const thisWeek = now.clone().startOf('week');
    const thisMonth = now.clone().startOf('month');
    const lastMonth = now.clone().subtract(1, 'month').startOf('month');

    // Session metrics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => !s.canceled && s.status !== 'completed').length;
    const completedSessions = sessions.filter(s => {
      const endTime = moment(s.end);
      return endTime.isBefore(now);
    }).length;
    const cancelledSessions = sessions.filter(s => s.canceled || s.status === 'cancelled').length;
    
    // Time-based metrics
    const todaySessions = sessions.filter(s => 
      moment(s.start).isSame(today, 'day') && !s.canceled
    ).length;
    
    const thisWeekSessions = sessions.filter(s => 
      moment(s.start).isSame(thisWeek, 'week') && !s.canceled
    ).length;
    
    const thisMonthSessions = sessions.filter(s => 
      moment(s.start).isSame(thisMonth, 'month') && !s.canceled
    ).length;
    
    const lastMonthSessions = sessions.filter(s => 
      moment(s.start).isSame(lastMonth, 'month') && !s.canceled
    ).length;
    
    // Growth calculations
    const monthlyGrowth = lastMonthSessions > 0 
      ? Math.round(((thisMonthSessions - lastMonthSessions) / lastMonthSessions) * 100)
      : thisMonthSessions > 0 ? 100 : 0;
    
    // Upcoming sessions
    const upcomingSessions = sessions.filter(s => 
      moment(s.start).isAfter(now) && !s.canceled && s.status !== 'completed'
    ).sort((a, b) => moment(a.start).diff(moment(b.start)));
    
    // Next 24 hours sessions
    const next24Hours = sessions.filter(s => 
      moment(s.start).isBetween(now, now.clone().add(24, 'hours')) && !s.canceled
    );

    // Session types
    const physicalSessions = sessions.filter(s => s.type !== 'virtual').length;

    // Participant metrics
    const approvedParticipants = allParticipants.filter(p => p.status === 'approved');
    const pendingParticipants = allParticipants.filter(p => p.status === 'pending');
    const rejectedParticipants = allParticipants.filter(p => p.status === 'rejected');
    
    // Unique clients with session counts
    const uniqueClients = new Map();
    approvedParticipants.forEach(p => {
      if (!uniqueClients.has(p.userId)) {
        uniqueClients.set(p.userId, { ...p, sessionCount: 1 });
      } else {
        uniqueClients.get(p.userId).sessionCount += 1;
      }
    });

    // Client retention metrics
    const repeatingClients = Array.from(uniqueClients.values()).filter(c => c.sessionCount > 1).length;
    const retentionRate = uniqueClients.size > 0 ? Math.round((repeatingClients / uniqueClients.size) * 100) : 0;

    // Capacity utilization
    const totalCapacity = sessions.reduce((sum, s) => sum + s.maxParticipants, 0);
    const totalBooked = sessions.reduce((sum, s) => sum + (s.currentParticipants || 0), 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    // Average session size
    const avgSessionSize = totalSessions > 0 ? Math.round(totalBooked / totalSessions) : 0;

    // Success rate (completed vs cancelled)
    const successRate = totalSessions > 0 
      ? Math.round((completedSessions / (completedSessions + cancelledSessions)) * 100) 
      : 100;

    return {
      // Basic metrics
      totalSessions,
      activeSessions,
      completedSessions,
      cancelledSessions,
      
      // Time-based metrics
      todaySessions,
      thisWeekSessions,
      thisMonthSessions,
      monthlyGrowth,
      
      // Session collections
      upcomingSessions: upcomingSessions.slice(0, 5),
      next24Hours,
      
      // Session types
      physicalSessions,
      virtualSessions: virtualSessions.length,
      
      // Participant metrics
      totalParticipants: approvedParticipants.length,
      pendingParticipants: pendingParticipants.length,
      rejectedParticipants: rejectedParticipants.length,
      uniqueClients: Array.from(uniqueClients.values()),
      repeatingClients,
      retentionRate,
      
      // Performance metrics
      utilizationRate,
      totalCapacity,
      totalBooked,
      avgSessionSize,
      successRate
    };
  }, [sessions, allParticipants, virtualSessions]);

  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">Trainer authentication required to access the dashboard.</p>
            <Button onClick={() => router.push('/login')} className="w-full bg-red-600 hover:bg-red-700">
              Sign In as Trainer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend, 
    trendValue,
    color = "blue",
    size = "default" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
    size?: 'default' | 'large'; 
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      red: 'bg-red-50 text-red-600 border-red-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100'
    };

    const textColors = {
      blue: 'text-blue-900',
      green: 'text-green-900',
      red: 'text-red-900',
      purple: 'text-purple-900',
      orange: 'text-orange-900'
    };

    return (
      <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${size === 'large' ? 'col-span-2' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
              </div>
              <p className={`text-3xl font-bold ${textColors[color]} mb-1`}>
                {value}
              </p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              {trend && trendValue && (
                <div className="flex items-center mt-3">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color }: {
    title: string;
    description: string;
    icon: any;
    onClick: () => void;
    color: string;
  }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Professional Dashboard</h1>
                  <p className="text-gray-300">Welcome back, {user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last updated: {moment().format("MMM D, h:mm A")}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Status: Active
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/trainer-sessions/schedule')} 
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
              <Button 
                onClick={() => router.push('/trainer-sessions/trainer-page')} 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Manage Sessions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans Section */}
      <div className="container mx-auto px-6 pt-8">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Service Offerings</h2>
                  <p className="text-gray-600">Current pricing plans and packages</p>
                </div>
              </div>
              {/* <Button variant="outline" onClick={() => router.push('/trainer/pricing')}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button> */}
            </div>
            {trainerPricingPlans.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {trainerPricingPlans.map((plan, index) => (
                  <Badge key={index} className="bg-purple-100 text-purple-800 px-3 py-1">
                    {plan}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-4">No pricing plans configured. Set up your packages to start accepting bookings.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 shadow-sm mb-8 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 font-medium px-6 py-2"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance Overview
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 font-medium px-6 py-2"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Session Management
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 font-medium px-6 py-2"
            >
              <Users className="w-4 h-4 mr-2" />
              Client Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your dashboard...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Key Performance Indicators */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      title="Total Revenue Sessions"
                      value={dashboardMetrics.totalSessions}
                      icon={Target}
                      subtitle={`${dashboardMetrics.activeSessions} currently active`}
                      trend={dashboardMetrics.monthlyGrowth > 0 ? 'up' : dashboardMetrics.monthlyGrowth < 0 ? 'down' : 'neutral'}
                      trendValue={`${dashboardMetrics.monthlyGrowth}% this month`}
                      color="blue"
                    />
                    <MetricCard
                      title="Client Engagement"
                      value={dashboardMetrics.totalParticipants}
                      icon={Users}
                      subtitle={`${dashboardMetrics.uniqueClients.length} unique clients`}
                      trend="up"
                      trendValue={`${dashboardMetrics.retentionRate}% retention rate`}
                      color="green"
                    />
                    <MetricCard
                      title="Capacity Utilization"
                      value={`${dashboardMetrics.utilizationRate}%`}
                      icon={TrendingUp}
                      subtitle={`${dashboardMetrics.totalBooked}/${dashboardMetrics.totalCapacity} spots filled`}
                      color="purple"
                    />
                    <MetricCard
                      title="Success Rate"
                      value={`${dashboardMetrics.successRate}%`}
                      icon={CheckCircle}
                      subtitle={`${dashboardMetrics.completedSessions} completed sessions`}
                      color="green"
                    />
                  </div>
                </div>

                {/* Today's Focus */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Focus</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                      title="Today's Sessions"
                      value={dashboardMetrics.todaySessions}
                      icon={CalendarIcon}
                      subtitle="Scheduled for today"
                      color="orange"
                    />
                    <MetricCard
                      title="Next 24 Hours"
                      value={dashboardMetrics.next24Hours.length}
                      icon={Timer}
                      subtitle="Upcoming sessions"
                      color="red"
                    />
                    <MetricCard
                      title="Pending Reviews"
                      value={dashboardMetrics.pendingParticipants}
                      icon={AlertCircle}
                      subtitle="Require your attention"
                      color={dashboardMetrics.pendingParticipants > 0 ? "red" : "green"}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard
                      title="Schedule New Session"
                      description="Create and configure a new training session"
                      icon={Plus}
                      onClick={() => router.push('/trainer-sessions/schedule')}
                      color="bg-blue-600"
                    />
                    <QuickActionCard
                      title="Trainer Reviews"
                      description="Approve or manage pending session requests"
                      icon={Eye}
                      onClick={() => router.push('/Analytics&Feedbacks/trainerFeedback')}
                      color="bg-green-600"
                    />
                    <QuickActionCard
                      title="Client Communications"
                      description="Message your clients and send updates"
                      icon={MessageSquare}
                      onClick={() => router.push('/trainer/messages')}
                      color="bg-purple-600"
                    />
                    <QuickActionCard
                      title="Performance Analytics"
                      description="View detailed reports and insights"
                      icon={BarChart3}
                      onClick={() => router.push('/Analytics&Feedbacks/trainer_analytics')}
                      color="bg-orange-600"
                    />
                  </div>
                </div>

                {/* Session Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Types */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <CardTitle className="flex items-center text-gray-900">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Session Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Physical Sessions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.physicalSessions}</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(dashboardMetrics.physicalSessions / dashboardMetrics.totalSessions) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Virtual Sessions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.virtualSessions}</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(dashboardMetrics.virtualSessions / dashboardMetrics.totalSessions) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.completedSessions}</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${(dashboardMetrics.completedSessions / dashboardMetrics.totalSessions) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <CardTitle className="flex items-center text-gray-900">
                        <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Capacity Utilization</span>
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.utilizationRate}%</span>
                          </div>
                          <Progress value={dashboardMetrics.utilizationRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Client Retention</span>
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.retentionRate}%</span>
                          </div>
                          <Progress value={dashboardMetrics.retentionRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Success Rate</span>
                            <span className="text-sm font-bold text-gray-900">{dashboardMetrics.successRate}%</span>
                          </div>
                          <Progress value={dashboardMetrics.successRate} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Sessions & Virtual Sessions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Sessions */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                      <CardTitle className="flex items-center justify-between text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-red-600" />
                          Upcoming Sessions
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {dashboardMetrics.upcomingSessions.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {dashboardMetrics.upcomingSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No upcoming sessions scheduled</p>
                          <Button 
                            onClick={() => router.push('/trainer-sessions/schedule')} 
                            size="sm" 
                            className="mt-3 bg-red-600 hover:bg-red-700"
                          >
                            Schedule Now
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dashboardMetrics.upcomingSessions.map((session) => (
                            <div key={session._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">{session.title}</h4>
                                  <Badge className={`text-xs ${
                                    session.type === 'virtual' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {session.type === 'virtual' ? 'Virtual' : 'In-Person'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {moment(session.start).format("MMM D, h:mm A")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {session.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {session.currentParticipants || 0}/{session.maxParticipants}
                                  </span>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => router.push('/trainer-sessions/trainer-page')}
                                className="ml-4"
                              >
                                Manage
                              </Button>
                            </div>
                          ))}
                          <div className="text-center pt-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => router.push('/trainer-sessions/trainer-page')}
                              className="text-red-600 hover:text-red-700"
                            >
                              View All Sessions
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Virtual Sessions */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="flex items-center justify-between text-gray-900">
                        <div className="flex items-center">
                          <Video className="w-5 h-5 mr-2 text-blue-600" />
                          Virtual Sessions
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {virtualSessions.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {virtualSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No virtual sessions available</p>
                          <p className="text-sm text-gray-400 mt-1">Start offering online training sessions</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {virtualSessions.slice(0, 4).map((session) => (
                            <div key={session._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div>
                                <p className="font-medium text-gray-900">{session.title}</p>
                                <p className="text-sm text-gray-600">
                                  {moment(session.start).format("MMM D, h:mm A")} • {session.location}
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                Online
                              </Badge>
                            </div>
                          ))}
                          {virtualSessions.length > 4 && (
                            <div className="text-center pt-2">
                              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                                View {virtualSessions.length - 4} More
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Active Sessions"
                value={dashboardMetrics.activeSessions}
                icon={CheckCircle}
                subtitle="Currently running"
                color="green"
              />
              <MetricCard
                title="Completed This Month"
                value={dashboardMetrics.thisMonthSessions}
                icon={Activity}
                subtitle={`${dashboardMetrics.monthlyGrowth > 0 ? '+' : ''}${dashboardMetrics.monthlyGrowth}% vs last month`}
                trend={dashboardMetrics.monthlyGrowth > 0 ? 'up' : dashboardMetrics.monthlyGrowth < 0 ? 'down' : 'neutral'}
                color="blue"
              />
              <MetricCard
                title="Cancelled Rate"
                value={`${dashboardMetrics.totalSessions > 0 ? Math.round((dashboardMetrics.cancelledSessions / dashboardMetrics.totalSessions) * 100) : 0}%`}
                icon={XCircle}
                subtitle={`${dashboardMetrics.cancelledSessions} total cancelled`}
                color="red"
              />
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="text-xl font-bold text-gray-900">Session Management Hub</CardTitle>
                <p className="text-gray-600 mt-1">Comprehensive overview of all your training sessions</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-green-800">{dashboardMetrics.activeSessions}</p>
                    <p className="text-sm font-medium text-green-700">Active Sessions</p>
                    <p className="text-xs text-green-600 mt-1">Ready to go</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <Activity className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-blue-800">{dashboardMetrics.completedSessions}</p>
                    <p className="text-sm font-medium text-blue-700">Completed</p>
                    <p className="text-xs text-blue-600 mt-1">Successfully finished</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <Clock className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-orange-800">{dashboardMetrics.upcomingSessions.length}</p>
                    <p className="text-sm font-medium text-orange-700">Upcoming</p>
                    <p className="text-xs text-orange-600 mt-1">Scheduled ahead</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-red-800">{dashboardMetrics.cancelledSessions}</p>
                    <p className="text-sm font-medium text-red-700">Cancelled</p>
                    <p className="text-xs text-red-600 mt-1">Not completed</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => router.push('/trainer-sessions/trainer-page')}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage All Sessions
                  </Button>
                  <Button 
                    onClick={() => router.push('/trainer-sessions/schedule')}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Clients"
                value={dashboardMetrics.uniqueClients.length}
                icon={Users}
                subtitle="Unique individuals"
                color="blue"
              />
              <MetricCard
                title="Repeat Clients"
                value={dashboardMetrics.repeatingClients}
                icon={Star}
                subtitle={`${dashboardMetrics.retentionRate}% retention rate`}
                color="green"
              />
              <MetricCard
                title="Pending Approvals"
                value={dashboardMetrics.pendingParticipants}
                icon={AlertCircle}
                subtitle="Awaiting response"
                color="orange"
              />
              <MetricCard
                title="Avg Session Size"
                value={dashboardMetrics.avgSessionSize}
                icon={Target}
                subtitle="Participants per session"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Clients */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center text-gray-900">
                    <Star className="w-5 h-5 mr-2 text-green-600" />
                    Top Performing Clients
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Most active participants</p>
                </CardHeader>
                <CardContent className="p-6">
                  {dashboardMetrics.uniqueClients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No clients registered yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start promoting your sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardMetrics.uniqueClients
                        .sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0))
                        .slice(0, 5)
                        .map((client, index) => (
                          <div key={client.userId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{client.userName}</p>
                                <p className="text-sm text-gray-500">{client.userEmail}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-green-100 text-green-800 mb-1">
                                {client.sessionCount} sessions
                              </Badge>
                              <p className="text-xs text-gray-500">Joined {moment(client.joinedAt).format("MMM YYYY")}</p>
                            </div>
                          </div>
                        ))}
                      {dashboardMetrics.uniqueClients.length > 5 && (
                        <div className="text-center pt-2">
                          <Button variant="ghost" className="text-green-600 hover:text-green-700">
                            View All {dashboardMetrics.uniqueClients.length} Clients
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                  <CardTitle className="flex items-center text-gray-900">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                    Pending Client Requests
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Require your immediate attention</p>
                </CardHeader>
                <CardContent className="p-6">
                  {dashboardMetrics.pendingParticipants === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                      <p className="text-green-600 font-medium">All caught up!</p>
                      <p className="text-sm text-gray-500 mt-1">No pending approvals at this time</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allParticipants
                        .filter(p => p.status === 'pending')
                        .slice(0, 5)
                        .map((participant) => (
                          <div key={participant._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{participant.userName}</p>
                                <p className="text-sm text-gray-500">{participant.userEmail}</p>
                                <p className="text-xs text-gray-400">Applied {moment(participant.joinedAt).fromNow()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Pending
                              </Badge>
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                      <div className="text-center pt-4 border-t border-gray-200">
                        <Button 
                          onClick={() => router.push('/trainer-sessions/trainer-page')}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Review All {dashboardMetrics.pendingParticipants} Requests
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrainerDashboard;