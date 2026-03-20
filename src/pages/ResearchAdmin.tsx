import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'fundamental', label: 'Fundamental' },
  { value: 'technical', label: 'Technical' },
  { value: 'sector', label: 'Sector Reports' },
  { value: 'macro', label: 'Macro & Global' },
  { value: 'strategy', label: 'Strategies' },
  { value: 'learning', label: 'Learning' },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'fundamental',
  tag: '',
  readTime: '5 min read',
  source: 'NextBull Research',
  featured: false,
  imageUrl: '',
};

const ResearchAdmin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Research Admin</CardTitle>
            <CardDescription>Loading account...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Research Admin</CardTitle>
            <CardDescription>Sign in to access the admin editor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Research Admin</CardTitle>
            <CardDescription>You do not have permission to post research.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => navigate('/research')}>
              Back to Research
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Use JPG, PNG, WebP, or GIF.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5 MB.', variant: 'destructive' });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `research/${fileName}`;

    const { error } = await supabase.storage.from('research-images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      toast({ title: 'Image upload failed', description: error.message, variant: 'destructive' });
      return null;
    }

    const { data: urlData } = supabase.storage.from('research-images').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    let imageUrl = form.imageUrl.trim() || null;

    if (imageFile) {
      setIsUploading(true);
      const uploaded = await uploadImage(imageFile);
      setIsUploading(false);
      if (!uploaded) {
        setIsSaving(false);
        return;
      }
      imageUrl = uploaded;
    }

    const { error } = await supabase.from('research_posts').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tag: form.tag.trim(),
      read_time: form.readTime.trim(),
      source: form.source.trim(),
      featured: form.featured,
      image_url: imageUrl,
    });

    if (error) {
      toast({
        title: 'Publish failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: 'Research posted',
      description: 'The article is now visible in Research.',
    });
    setForm(DEFAULT_FORM);
    clearImage();
    setIsSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Research Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish research posts for everyone to read.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New Research Post</CardTitle>
          <CardDescription>Only admins can publish.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Write the headline"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Summary</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short summary for the research card"
                rows={5}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag">Tag</Label>
                <Input
                  id="tag"
                  value={form.tag}
                  onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))}
                  placeholder="Earnings Analysis"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readTime">Read time</Label>
                <Input
                  id="readTime"
                  value={form.readTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, readTime: event.target.value }))}
                  placeholder="8 min read"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={form.source}
                  onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                  placeholder="NextBull Research"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image (optional)</Label>
              <div className="flex flex-col gap-3">
                {imagePreview ? (
                  <div className="relative w-full max-w-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="imageFile"
                    className="flex items-center justify-center gap-2 w-full max-w-sm h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                  </label>
                )}
                <input
                  ref={fileInputRef}
                  id="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP, or GIF — max 5 MB. Or paste a URL below.</p>
                <Input
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(value) =>
                  setForm((prev) => ({ ...prev, featured: value === true }))
                }
              />
              <Label htmlFor="featured">Mark as featured</Label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSaving || isUploading}>
                {isUploading ? 'Uploading image...' : isSaving ? 'Publishing...' : 'Publish'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/research')}>
                View Research
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchAdmin;
