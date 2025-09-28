import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, SystemSettings } from '@/services/settingsService';
import { toast } from '@/hooks/use-toast';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<Omit<SystemSettings, 'id' | 'createdAt'>>) =>
      settingsService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });
};
