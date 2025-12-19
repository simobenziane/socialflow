import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClient, useUpdateClient, useAccounts } from '@/hooks';
import { PageHeader, LoadingSpinner, ErrorAlert } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function EditClient() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const client = useClient(slug || '');
  const updateClient = useUpdateClient();
  const accounts = useAccounts();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('restaurant');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [tiktokAccountId, setTiktokAccountId] = useState('');
  const [feedTime, setFeedTime] = useState('20:00');
  const [storyTime, setStoryTime] = useState('18:30');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form with client data
  useEffect(() => {
    if (client.data?.data && !isInitialized) {
      const clientData = client.data.data;
      setName(clientData.name);
      setType(clientData.type);
      setLanguage(clientData.language);
      setTimezone(clientData.timezone);
      setInstagramAccountId(clientData.accounts?.instagram?.late_account_id || '');
      setTiktokAccountId(clientData.accounts?.tiktok?.late_account_id || '');
      setFeedTime(clientData.schedule?.feed_time || '20:00');
      setStoryTime(clientData.schedule?.story_time || '18:30');
      setIsInitialized(true);
    }
  }, [client.data, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateClient.isPending || !slug) return;

    if (!name) {
      toast({
        title: 'Validation error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateClient.mutateAsync({
        slug,
        input: {
          name,
          slug, // Slug is immutable but we need to pass it
          type,
          language,
          timezone,
          instagram_account_id: instagramAccountId && instagramAccountId !== 'none' ? instagramAccountId : undefined,
          tiktok_account_id: tiktokAccountId && tiktokAccountId !== 'none' ? tiktokAccountId : undefined,
          feed_time: feedTime,
          story_time: storyTime,
        },
      });

      toast({
        title: 'Client updated',
        description: `Successfully updated ${name}`,
      });

      navigate(`/clients/${slug}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update client',
        variant: 'destructive',
      });
    }
  };

  if (!slug) {
    return <ErrorAlert message="No client specified" />;
  }

  if (client.isLoading || accounts.isLoading) {
    return <LoadingSpinner text="Loading client..." />;
  }

  if (client.error) {
    return (
      <ErrorAlert
        message={client.error.message}
        onRetry={() => client.refetch()}
      />
    );
  }

  const clientData = client.data?.data;
  if (!clientData) {
    return <ErrorAlert message="Client not found" />;
  }

  const instagramAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'instagram') || [];
  const tiktokAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'tiktok') || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Edit Client"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: clientData.name, to: `/clients/${slug}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Berlin Doner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Slug cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Social Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Link Social Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Instagram Account</Label>
              <Select value={instagramAccountId} onValueChange={setInstagramAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Instagram account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {instagramAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username} - {account.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>TikTok Account</Label>
              <Select value={tiktokAccountId} onValueChange={setTiktokAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select TikTok account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tiktokAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username} - {account.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posting Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Posting Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedTime">Feed posts at</Label>
                <Input
                  id="feedTime"
                  type="time"
                  value={feedTime}
                  onChange={(e) => setFeedTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storyTime">Story posts at</Label>
                <Input
                  id="storyTime"
                  type="time"
                  value={storyTime}
                  onChange={(e) => setStoryTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/clients/${slug}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateClient.isPending}>
            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
