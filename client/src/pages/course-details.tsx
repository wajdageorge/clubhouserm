import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, Calendar, Users, Flag } from "lucide-react";

export default function CourseDetails() {
  useDocumentTitle("Course Details", "View and manage course information and specifications");
  const { user } = useAuth();

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <TopBar title="Course Details" description="View comprehensive course information" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <TopBar title="Course Details" description="View comprehensive course information" />
          <div className="p-6 text-center py-12">
            <p className="text-muted-foreground">No course data available</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Course Details" description="View comprehensive course information" />
        <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Course Details</h1>
          <p className="text-muted-foreground">View comprehensive course information</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General course details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Course Name</Label>
                <p className="font-medium" data-testid="text-course-name">{course.name}</p>
              </div>
              {course.description && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm" data-testid="text-course-description">{course.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="text-sm" data-testid="text-course-address">{course.address}</p>
                  </div>
                </div>
              )}
              {course.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm" data-testid="text-course-phone">{course.phone}</p>
                  </div>
                </div>
              )}
              {course.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm" data-testid="text-course-email">{course.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Specifications</CardTitle>
              <CardDescription>Technical course information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.holes && (
                <div className="flex items-center gap-3">
                  <Flag className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Number of Holes</Label>
                    <p className="font-medium" data-testid="text-course-holes">{course.holes}</p>
                  </div>
                </div>
              )}
              {course.par && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Par</Label>
                  <p className="font-medium" data-testid="text-course-par">{course.par}</p>
                </div>
              )}
              {course.yardage && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Yardage</Label>
                  <p className="font-medium" data-testid="text-course-yardage">{course.yardage} yards</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
              <CardDescription>Operating information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.seasonStart && course.seasonEnd && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Season</Label>
                    <p className="text-sm" data-testid="text-course-season">
                      {new Date(course.seasonStart).toLocaleDateString()} - {new Date(course.seasonEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {course.peakMonths && course.peakMonths.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Peak Months</Label>
                    <p className="text-sm" data-testid="text-course-peak-months">
                      {course.peakMonths.join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
    </div>
  );
}
