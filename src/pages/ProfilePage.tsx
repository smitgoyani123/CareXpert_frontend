import { useState } from "react";
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

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    age: "28",
    address: "123 Main Street, City, State 12345",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const baseUrl = `${import.meta.env.VITE_BASE_URL}/api/user`;
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Save to backend with multipart form data
    const doSave = async () => {
      try {
        setSaving(true);
        const form = new FormData();
        if (formData.name && formData.name !== user?.name)
          form.append("name", formData.name);
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
          setFormData((prev) => ({
            ...prev,
            name: updatedUser.name || prev.name,
            email: updatedUser.email || prev.email,
          }));
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
    doSave();
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "bg-white" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "bg-white" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "bg-white" : "bg-gray-50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? "bg-white" : "bg-gray-50"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  className={isEditing ? "bg-white" : "bg-gray-50"}
                />
              </div>

              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex space-x-4 pt-4"
                >
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </motion.div>
              )}
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
