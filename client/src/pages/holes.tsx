import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, Ruler, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HoleInformation() {
  useDocumentTitle("Hole Information", "View hole-by-hole details, yardages, and handicap information");
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
          <TopBar title="Hole Information" description="Detailed information for each hole on the course" />
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
          <TopBar title="Hole Information" description="Detailed information for each hole on the course" />
          <div className="p-6 text-center py-12">
            <p className="text-muted-foreground">No course data available</p>
          </div>
        </main>
      </div>
    );
  }

  // Generate hole data for display (simplified example)
  const holes = Array.from({ length: course.holes || 18 }, (_, i) => ({
    number: i + 1,
    par: i % 9 === 0 || i % 9 === 4 || i % 9 === 8 ? 5 : i % 3 === 0 ? 3 : 4,
    yardage: i % 9 === 0 || i % 9 === 4 || i % 9 === 8 ? 520 + i * 5 : i % 3 === 0 ? 165 + i * 3 : 380 + i * 4,
    handicap: i + 1,
  }));

  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalYardage = holes.reduce((sum, hole) => sum + hole.yardage, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Hole Information" description="Detailed information for each hole on the course" />
        <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Hole Information</h1>
          <p className="text-muted-foreground">Detailed information for each hole on the course</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holes</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-holes">{course.holes || 18}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Par</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-par">{totalPar}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Yardage</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-yardage">{totalYardage}</div>
              <p className="text-xs text-muted-foreground">yards</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hole Details</CardTitle>
            <CardDescription>Information for each hole</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hole</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead>Yardage</TableHead>
                    <TableHead>Handicap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holes.map((hole) => (
                    <TableRow key={hole.number} data-testid={`row-hole-${hole.number}`}>
                      <TableCell className="font-medium">{hole.number}</TableCell>
                      <TableCell>{hole.par}</TableCell>
                      <TableCell>{hole.yardage}</TableCell>
                      <TableCell>{hole.handicap}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell>{totalPar}</TableCell>
                    <TableCell>{totalYardage}</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}
