/**
 * ProfilePage.tsx - Refactored to use react-hook-form with Zod validation
 * 
 * Changes made:
 * 1. Replaced useState for formData with useForm hook from react-hook-form
 * 2. Added Zod schema (profileSchema) for type-safe validation
 * 3. Removed manual handleInputChange - now using register()
 * 4. Added inline error messages for each field
 * 5. Centralized validation in Zod schema
 * 6. Used zodResolver to connect Zod schema with react-hook-form
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Edit, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

/**
 * Zod Schema for Profile Form
 * Defines validation rules for all profile fields
 */
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  age: z.string().min(1, "Age is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 150,
    "Please enter a valid age"
  ),
  address: z.string().min(1, "Address is required"),
});

// Type inference from Zod schema
type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const baseUrl = `${import.meta.env.VITE_BASE_URL}/api/user`;
  const [saving, setSaving] = useState(false);

  /**
   * Profile Form - using react-hook-form with Zod resolver
   */
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "John Doe",
      email: user?.email || "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      age: "28",
      address: "123 Main Street, City, State 12345",
    },
  });

  // Watch form values for display in profile card
  const formData = watch();

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "John Doe",
        email: user.email || "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        age: "28",
        address: "123 Main Street, City, State 12345",
      });
    }
  }, [user, reset]);

  /**
   * Handle form submission - simplified with react-hook-form
   * Validation is handled automatically by zodResolver
   */
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      const form = new FormData();
      if (data.name && data.name !== user?.name)
        form.append("name", data.name);
      if (selectedImage) form.append("profilePicture", selectedImage);

      const endpoint =
        user?.role === "DOCTOR"
          ? `${baseUrl}/update-doctor`
          : `${baseUrl}/update-patient`;
      const res = await axios.put(endpoint, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to update profile");
      }

      // Fetch fresh profile to ensure updated data
      const me = await axios.get(`${baseUrl}/authenticated-profile`, {
        withCredentials: true,
      });
      if (me.data?.success && me.data?.data?.user) {
        const updatedUser = me.data.data.user;
        setUser(updatedUser);
        reset({
          ...data,
          name: updatedUser.name || data.name,
          email: updatedUser.email || data.email,
        });
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to update profile"
        );
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    reset({
      name: user?.name || "John Doe",
      email: user?.email || "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      age: "28",
      address: "123 Main Street, City, State 12345",
    });
    setIsEditing(false);
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          My Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Manage your personal information and account settings
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="sticky top-8">
            <CardHeader className="text-center">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={
                      previewUrl ||
                      user?.profilePicture ||
                      "/placeholder-user.jpg"
                    }
                    alt="Profile Picture"
                  />
                  <AvatarFallback className="text-2xl">
                    {formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="mt-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
              <CardTitle className="text-xl">{formData.name}</CardTitle>
              <CardDescription className="text-base">
                {user?.role || "Patient"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4" />
                <span>{formData.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>Age: {formData.age}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{formData.address}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form using react-hook-form's handleSubmit */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      disabled={!isEditing}
                      className={isEditing ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                    />
                    {/* Display validation error from Zod schema */}
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      disabled={!isEditing}
                      className={isEditing ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      disabled={!isEditing}
                      className={isEditing ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      {...register("age")}
                      disabled={!isEditing}
                      className={isEditing ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                    />
                    {errors.age && (
                      <p className="text-sm text-red-500">{errors.age.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    disabled={!isEditing}
                    className={isEditing ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex space-x-4 pt-4 mt-4"
                  >
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Additional Information Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Account Information</CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Type
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user?.role || "Patient"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Member Since
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">
                      January 2024
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
