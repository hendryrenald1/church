# View/Edit Family Detail Screen - LLM Instructions

## Overview

Create a comprehensive family detail page that allows admins to view, edit, and manage all aspects of a family unit including head, spouse, children, and family information. This page should match the functionality of the enhanced "Add Family" form while providing additional management capabilities.

---

## Route & File Location

**File:** `app/[churchSlug]/admin/families/[familyId]/page.tsx`

**URL Pattern:** `/{churchSlug}/admin/families/{familyId}`

**Access:** Admin and Pastor roles (with appropriate permissions)

---

## Data Structure to Fetch

### Family Detail Query

```typescript
interface FamilyDetail {
  id: string;
  churchId: string;
  familyName: string;
  weddingAnniversary: Date | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: FamilyMemberDetail[];
}

interface FamilyMemberDetail {
  id: string; // family_members.id
  memberId: string;
  relationship: 'HEAD' | 'SPOUSE' | 'CHILD' | 'OTHER';
  isPrimaryContact: boolean;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    email: string | null;
    phone: string | null;
    whatsappPhone: string | null;
    dateOfBirth: Date | null;
    baptismDate: Date | null;
    status: 'ACTIVE' | 'INACTIVE';
    branchId: string | null;
    branch: {
      name: string;
    } | null;
  };
}
```

### Database Query

```typescript
// Server Component or API route
async function getFamilyDetail(familyId: string, churchId: string) {
  const { data, error } = await supabase
    .from('families')
    .select(`
      *,
      members:family_members(
        id,
        relationship,
        is_primary_contact,
        member:members(
          id,
          first_name,
          last_name,
          gender,
          email,
          phone,
          whatsapp_phone,
          date_of_birth,
          baptism_date,
          status,
          branch:branches(name)
        )
      )
    `)
    .eq('id', familyId)
    .eq('church_id', churchId)
    .single();

  if (error) throw error;
  return data;
}
```

---

## Page Layout Structure

### Overall Layout (Two-Column)

```typescript
export default async function FamilyDetailPage({ 
  params 
}: { 
  params: { churchSlug: string; familyId: string } 
}) {
  const family = await getFamilyDetail(params.familyId);

  return (
    <div className="space-y-6 p-6">
      {/* Header with actions */}
      <FamilyHeader family={family} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <FamilyInformationCard family={family} />
          <FamilyMembersSection family={family} />
        </div>

        {/* Right column: Sidebar (1/3 width) */}
        <div className="space-y-6">
          <FamilyStatsCard family={family} />
          <QuickActionsCard family={family} />
          <FamilyTimelineCard family={family} />
        </div>
      </div>
    </div>
  );
}
```

---

## Component 1: Family Header

### Purpose
Display family name with breadcrumb navigation and action buttons

### Implementation

```typescript
'use client';

import { ArrowLeft, Edit, Trash2, MoreVertical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function FamilyHeader({ family }: { family: FamilyDetail }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await fetch(`/api/admin/families/${family.id}`, {
        method: 'DELETE',
      });
      router.push(`/${churchSlug}/admin/families`);
      toast.success('Family deleted successfully');
    } catch (error) {
      toast.error('Failed to delete family');
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${churchSlug}/admin/families`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Families
        </Button>
      </div>

      {/* Header with actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{family.familyName}</h1>
          <p className="text-muted-foreground mt-1">
            {family.members.length} member{family.members.length !== 1 ? 's' : ''}
            {family.weddingAnniversary && (
              <span className="ml-2">
                • Anniversary: {format(new Date(family.weddingAnniversary), 'MMMM dd, yyyy')}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${churchSlug}/admin/families/${family.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Family
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {/* Send message to family */}}>
                <Send className="h-4 w-4 mr-2" />
                Send Message to Family
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Family
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the family unit "{family.familyName}" but will NOT delete 
              the individual member records. Members will still exist in your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Family
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## Component 2: Family Information Card

### Purpose
Display and allow inline editing of family basic information

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit2, Check, X, Calendar as CalendarIcon, Home, Heart } from 'lucide-react';
import { format } from 'date-fns';

export function FamilyInformationCard({ family }: { family: FamilyDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    familyName: family.familyName,
    weddingAnniversary: family.weddingAnniversary,
    address: family.address || '',
  });

  const handleSave = async () => {
    try {
      await fetch(`/api/admin/families/${family.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      toast.success('Family information updated');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update family');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Family Information
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData({
                    familyName: family.familyName,
                    weddingAnniversary: family.weddingAnniversary,
                    address: family.address || '',
                  });
                  setIsEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <div>
              <Label>Family Name</Label>
              <Input
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                placeholder="e.g., Smith Family"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Wedding Anniversary
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.weddingAnniversary ? (
                      format(new Date(formData.weddingAnniversary), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.weddingAnniversary ? new Date(formData.weddingAnniversary) : undefined}
                    onSelect={(date) => setFormData({ ...formData, weddingAnniversary: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Family home address"
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Family Name</p>
                <p className="text-lg font-semibold">{family.familyName}</p>
              </div>

              {family.weddingAnniversary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Wedding Anniversary
                  </p>
                  <p className="text-lg font-semibold">
                    {format(new Date(family.weddingAnniversary), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculateYearsMarried(family.weddingAnniversary)} years married
                  </p>
                </div>
              )}

              {family.address && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Address
                  </p>
                  <p className="text-base mt-1 whitespace-pre-wrap">{family.address}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function
function calculateYearsMarried(anniversaryDate: Date): number {
  const today = new Date();
  const anniversary = new Date(anniversaryDate);
  return today.getFullYear() - anniversary.getFullYear();
}
```

---

## Component 3: Family Members Section

### Purpose
Display all family members with ability to add, edit, remove, and reorder

### Implementation

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ExternalLink,
  Crown,
  Heart,
  Baby,
  Phone,
  Mail,
  Calendar,
  Droplet,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function FamilyMembersSection({ family }: { family: FamilyDetail }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Group members by relationship
  const head = family.members.find(m => m.relationship === 'HEAD');
  const spouse = family.members.find(m => m.relationship === 'SPOUSE');
  const children = family.members.filter(m => m.relationship === 'CHILD');
  const others = family.members.filter(m => m.relationship === 'OTHER');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Members ({family.members.length})
          </CardTitle>
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <AddFamilyMemberDialog 
                familyId={family.id}
                existingMemberIds={family.members.map(m => m.memberId)}
                onSuccess={() => {
                  setShowAddMember(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Head Member */}
        {head && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold">Head of Family</h3>
            </div>
            <MemberCard 
              familyMember={head} 
              familyId={family.id}
              onRemove={setMemberToRemove}
            />
          </div>
        )}

        {/* Spouse */}
        {spouse && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold">Spouse</h3>
            </div>
            <MemberCard 
              familyMember={spouse} 
              familyId={family.id}
              onRemove={setMemberToRemove}
            />
          </div>
        )}

        {/* Children */}
        {children.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Baby className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Children ({children.length})</h3>
            </div>
            <div className="space-y-2">
              {children.map((child) => (
                <MemberCard
                  key={child.id}
                  familyMember={child}
                  familyId={family.id}
                  onRemove={setMemberToRemove}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Members */}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold">Other Members ({others.length})</h3>
            </div>
            <div className="space-y-2">
              {others.map((other) => (
                <MemberCard
                  key={other.id}
                  familyMember={other}
                  familyId={family.id}
                  onRemove={setMemberToRemove}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {family.members.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No family members yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddMember(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Member
            </Button>
          </div>
        )}

        {/* Remove Member Confirmation */}
        <AlertDialog 
          open={!!memberToRemove} 
          onOpenChange={() => setMemberToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Family?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this member from the family unit but will NOT delete 
                their member record. They will still exist in your members database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRemoveMember(memberToRemove!)}
                className="bg-destructive text-destructive-foreground"
              >
                Remove from Family
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Individual Member Card Component
function MemberCard({ 
  familyMember, 
  familyId,
  onRemove 
}: { 
  familyMember: FamilyMemberDetail;
  familyId: string;
  onRemove: (id: string) => void;
}) {
  const { member } = familyMember;
  const age = member.dateOfBirth ? calculateAge(member.dateOfBirth) : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Left: Avatar and Info */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`/avatars/${member.id}.jpg`} />
              <AvatarFallback>
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Name and Status */}
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-lg">
                  {member.firstName} {member.lastName}
                </h4>
                <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {member.status === 'ACTIVE' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {member.status}
                </Badge>
                {familyMember.isPrimaryContact && (
                  <Badge variant="outline">Primary Contact</Badge>
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {age !== null && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{age} years old</span>
                  </div>
                )}
                {member.baptismDate && (
                  <div className="flex items-center gap-2">
                    <Droplet className="h-3 w-3" />
                    <span>Baptized {format(new Date(member.baptismDate), 'MMM yyyy')}</span>
                  </div>
                )}
                {member.branch && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{member.branch.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/${churchSlug}/admin/members/${member.id}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/${churchSlug}/admin/members/${member.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onRemove(familyMember.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Family
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
```

---

## Component 4: Add Family Member Dialog

### Purpose
Allow adding existing or new members to the family

### Implementation

```typescript
function AddFamilyMemberDialog({ 
  familyId, 
  existingMemberIds,
  onSuccess 
}: {
  familyId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState('existing');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<string>('CHILD');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  // Fetch members not in this family
  const { data: availableMembers } = useSWR(
    `/api/admin/members?exclude=${existingMemberIds.join(',')}`
  );

  const handleAddExisting = async () => {
    try {
      await fetch(`/api/admin/families/${familyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember,
          relationship,
          isPrimaryContact,
        }),
      });
      toast.success('Member added to family');
      onSuccess();
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const handleCreateNew = async (memberData: any) => {
    try {
      // Create member first
      const createResponse = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const { member } = await createResponse.json();

      // Link to family
      await fetch(`/api/admin/families/${familyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          relationship,
          isPrimaryContact,
        }),
      });

      toast.success('New member created and added to family');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create member');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Family Member</DialogTitle>
        <DialogDescription>
          Add an existing member or create a new member to link to this family
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Relationship Selection (Common) */}
        <div>
          <Label>Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HEAD">Head of Family</SelectItem>
              <SelectItem value="SPOUSE">Spouse</SelectItem>
              <SelectItem value="CHILD">Child</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="primary-contact"
            checked={isPrimaryContact}
            onCheckedChange={(checked) => setIsPrimaryContact(checked as boolean)}
          />
          <Label htmlFor="primary-contact">Set as primary contact</Label>
        </div>

        <Separator />

        {/* Tabs for Existing vs New */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Select Existing</TabsTrigger>
            <TabsTrigger value="new">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <Combobox
              placeholder="Search for member..."
              options={availableMembers || []}
              value={selectedMember}
              onChange={setSelectedMember}
              displayFormat={(member) => 
                `${member.firstName} ${member.lastName} ${member.email ? `(${member.email})` : ''}`
              }
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <CreateMemberForm 
              onSubmit={handleCreateNew}
              defaultLastName={/* Suggest from head member */}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button
          onClick={selectedTab === 'existing' ? handleAddExisting : undefined}
          disabled={selectedTab === 'existing' && !selectedMember}
        >
          {selectedTab === 'existing' ? 'Add to Family' : 'Create & Add'}
        </Button>
      </DialogFooter>
    </>
  );
}
```

---

## Component 5: Family Stats Card (Sidebar)

### Purpose
Show quick stats and metrics about the family

### Implementation

```typescript
export function FamilyStatsCard({ family }: { family: FamilyDetail }) {
  const totalMembers = family.members.length;
  const activeMembers = family.members.filter(m => m.member.status === 'ACTIVE').length;
  const children = family.members.filter(m => m.relationship === 'CHILD');
  const avgAge = calculateAverageAge(family.members);
  const baptizedCount = family.members.filter(m => m.member.baptismDate).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Family Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalMembers}
            </p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeMembers}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {children.length}
            </p>
            <p className="text-xs text-muted-foreground">Children</p>
          </div>

          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {avgAge || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Avg Age</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Baptized</span>
            <Badge variant="outline">
              {baptizedCount}/{totalMembers}
            </Badge>
          </div>

          {family.weddingAnniversary && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Years Married</span>
              <Badge variant="outline">
                {calculateYearsMarried(family.weddingAnniversary)}
              </Badge>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">
              {format(new Date(family.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateAverageAge(members: FamilyMemberDetail[]): number | null {
  const ages = members
    .map(m => m.member.dateOfBirth ? calculateAge(m.member.dateOfBirth) : null)
    .filter((age): age is number => age !== null);

  if (ages.length === 0) return null;

  return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
}
```

---

## Component 6: Quick Actions Card (Sidebar)

### Purpose
Provide common actions related to the family

### Implementation

```typescript
export function QuickActionsCard({ family }: { family: FamilyDetail }) {
  const router = useRouter();

  const actions = [
    {
      icon: Send,
      label: 'Send Message to All',
      description: 'WhatsApp/SMS to all members',
      onClick: () => {/* Send group message */},
      variant: 'default' as const,
    },
    {
      icon: UserPlus,
      label: 'Add New Member',
      description: 'Create and link new member',
      onClick: () => {/* Open add member dialog */},
      variant: 'outline' as const,
    },
    {
      icon: Calendar,
      label: 'Schedule Event',
      description: 'Family gathering or activity',
      onClick: () => router.push(`/${churchSlug}/admin/events/new?family=${family.id}`),
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: 'View Reports',
      description: 'Family attendance, giving, etc.',
      onClick: () => router.push(`/${churchSlug}/admin/reports?family=${family.id}`),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4 mr-2" />
            <div className="text-left flex-1">
              <p className="font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## Component 7: Family Timeline Card (Sidebar)

### Purpose
Show recent activities related to this family

### Implementation

```typescript
export function FamilyTimelineCard({ family }: { family: FamilyDetail }) {
  const { data: activities } = useSWR(
    `/api/admin/families/${family.id}/activities`
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {index !== activities.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: string) {
  const icons = {
    member_added: <UserPlus className="h-3 w-3 text-white" />,
    member_removed: <UserMinus className="h-3 w-3 text-white" />,
    family_updated: <Edit className="h-3 w-3 text-white" />,
    message_sent: <Send className="h-3 w-3 text-white" />,
  };
  return icons[type] || <Activity className="h-3 w-3 text-white" />;
}

function getActivityColor(type: string) {
  const colors = {
    member_added: 'bg-green-500',
    member_removed: 'bg-red-500',
    family_updated: 'bg-blue-500',
    message_sent: 'bg-purple-500',
  };
  return colors[type] || 'bg-gray-500';
}
```

---

## API Routes Required

### 1. GET Family Detail
```typescript
// app/api/admin/families/[familyId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  // Fetch and return family with members
}
```

### 2. PATCH Update Family
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  const body = await request.json();
  // Update family basic info
  // Log activity
}
```

### 3. DELETE Family
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  // Delete family_members entries
  // Delete family
  // Log activity
}
```

### 4. POST Add Member to Family
```typescript
// app/api/admin/families/[familyId]/members/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  const { memberId, relationship, isPrimaryContact } = await request.json();
  
  // Create family_member entry
  // Log activity
}
```

### 5. DELETE Remove Member from Family
```typescript
// app/api/admin/families/[familyId]/members/[familyMemberId]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; familyMemberId: string } }
) {
  // Delete family_member entry (not the member itself)
  // Log activity
}
```

### 6. GET Family Activities
```typescript
// app/api/admin/families/[familyId]/activities/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  // Return activities related to this family
}
```

---

## Mobile Responsive Considerations

```typescript
// Mobile layout adjustments
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content stacks on mobile, side-by-side on desktop */}
</div>

// Hide sidebar on mobile, show in sheet/drawer
<div className="hidden lg:block">
  <FamilyStatsCard />
</div>

<Sheet> {/* Mobile version */}
  <SheetTrigger asChild>
    <Button variant="outline" className="lg:hidden">
      View Stats
    </Button>
  </SheetTrigger>
  <SheetContent>
    <FamilyStatsCard />
  </SheetContent>
</Sheet>
```

---

## Additional UX Enhancements

### 1. Breadcrumb Navigation
```typescript
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href={`/${churchSlug}/admin`}>Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href={`/${churchSlug}/admin/families`}>Families</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{family.familyName}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 2. Loading States
```typescript
export default async function FamilyDetailPage({ params }) {
  return (
    <Suspense fallback={<FamilyDetailSkeleton />}>
      <FamilyDetailContent familyId={params.familyId} />
    </Suspense>
  );
}

function FamilyDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
```

### 3. Empty States for Each Section
```typescript
// No spouse
{!spouse && (
  <Card className="border-dashed">
    <CardContent className="p-6 text-center">
      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No spouse added</p>
      <Button variant="ghost" size="sm" className="mt-2">
        Add Spouse
      </Button>
    </CardContent>
  </Card>
)}
```

### 4. Keyboard Shortcuts
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      router.push(`/${churchSlug}/admin/families/${familyId}/edit`);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### 5. Optimistic Updates
```typescript
const handleUpdateFamily = async (data) => {
  // Optimistically update UI
  mutate(`/api/admin/families/${familyId}`, {
    ...family,
    ...data,
  }, false);

  // Make API call
  try {
    await fetch(`/api/admin/families/${familyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Revert on error
    mutate(`/api/admin/families/${familyId}`);
  }
};
```

---

## Success Criteria

The View/Edit Family page should:

✅ Display complete family information at a glance  
✅ Allow inline editing of basic family info  
✅ Show all family members with detailed contact info  
✅ Support adding members (existing or new) in-page  
✅ Provide quick access to member profiles  
✅ Show relevant stats and metrics  
✅ Display recent family-related activities  
✅ Offer quick actions for common tasks  
✅ Work seamlessly on mobile and desktop  
✅ Load quickly with proper skeleton states  

---

## End of Instructions

This comprehensive guide provides everything needed to create a professional, feature-rich family detail page that complements the enhanced "Add Family" form and provides complete family management capabilities.
