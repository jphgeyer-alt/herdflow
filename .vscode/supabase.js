import { useEffect } from 'react';
import { supabase } from './supabase'; // Your supabase config file

function CattleListScreen() {
  useEffect(() => {
    // 1. Create the 'listener' channel
    const cattleChannel = supabase
      .channel('any-string-name') // Name of the "room"
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'cattle' }, 
        (payload) => {
          console.log('Change received!', payload);
          // 2. Refresh your data here
          fetchLatestCattle(); 
        }
      )
      .subscribe();

    // 3. Clean up when the user leaves the screen
    return () => {
      supabase.removeChannel(cattleChannel);
    };
  }, []);

  // ... the rest of your screen code
}
