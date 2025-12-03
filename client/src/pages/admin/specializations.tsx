import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  AlertCircle,
  Edit,
  Trash2,
  Activity,
  Leaf,
  Heart,
  Sparkles,
  Scissors,
  Eye,
  Baby,
  Users,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Specialization } from "@shared/schema";

const iconOptions = [
  { value: "Leaf", label: "Leaf", icon: Leaf },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
  { value: "Scissors", label: "Scissors", icon: Scissors },
  { value: "Eye", label: "Eye", icon: Eye },
  { value: "Baby", label: "Baby", icon: Baby },
  { value: "Users", label: "Users", icon: Users },
  { value: "Brain", label: "Brain", icon: Brain },
  { value: "Activity", label: "Activity", icon: Activity },
];

const getIconComponent = (iconName: string) => {
  const icon = iconOptions.find(i => i.value === iconName);
  return icon ? icon.icon : Activity;
};

export default function AdminSpecializationsPage() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<Specialization | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "Leaf" });

  const { data: specializations = [], isLoading, isError } = useQuery<Specialization[]>({
    queryKey: ["/api/specializations"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; icon: string }) => 
      apiRequest("POST", "/api/specializations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specializations"] });
      toast({
        title: "Specialization Created",
        description: "The specialization has been created successfully.",
      });
      setShowAddDialog(false);
      setFormData({ name: "", description: "", icon: "Leaf" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create specialization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string; icon: string } }) => 
      apiRequest("PUT", `/api/admin/specializations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specializations"] });
      toast({
        title: "Specialization Updated",
        description: "The specialization has been updated successfully.",
      });
      setShowEditDialog(false);
      setSelectedSpec(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update specialization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/specializations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specializations"] });
      toast({
        title: "Specialization Deleted",
        description: "The specialization has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedSpec(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete specialization. It may be in use by doctors.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (spec: Specialization) => {
    setSelectedSpec(spec);
    setFormData({
      name: spec.name,
      description: spec.description || "",
      icon: spec.icon || "Leaf",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (spec: Specialization) => {
    setSelectedSpec(spec);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return <LoadingPage message="Loading specializations..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load specializations. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Specializations</h1>
          <p className="text-muted-foreground">Manage Ayurvedic medical specializations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add">
          <Plus className="h-4 w-4 mr-2" />
          Add Specialization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {specializations.map((spec) => {
          const IconComponent = getIconComponent(spec.icon || "Activity");
          return (
            <Card key={spec.id} className="hover-elevate" data-testid={`card-spec-${spec.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{spec.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {spec.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(spec)}
                      data-testid={`button-edit-${spec.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(spec)}
                      data-testid={`button-delete-${spec.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {specializations.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No specializations yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add your first specialization to get started
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specialization
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Specialization</DialogTitle>
            <DialogDescription>
              Create a new Ayurvedic medical specialization
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Panchakarma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the specialization..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger data-testid="select-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
              data-testid="button-submit"
            >
              Create Specialization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Specialization</DialogTitle>
            <DialogDescription>
              Update the specialization details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger data-testid="select-edit-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedSpec) {
                  updateMutation.mutate({ id: selectedSpec.id, data: formData });
                }
              }}
              disabled={!formData.name || updateMutation.isPending}
              data-testid="button-update"
            >
              Update Specialization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specialization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSpec?.name}"? This action cannot be undone.
              Doctors with this specialization will need to update their profiles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSpec) {
                  deleteMutation.mutate(selectedSpec.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
