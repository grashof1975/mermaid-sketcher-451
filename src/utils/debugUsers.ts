// Debug utility to search for users in the database
import { supabase } from './supabase';

export const debugSearchUsers = async () => {
  console.log('=== DEBUG: Searching for users ===');
  
  try {
    // 1. Check all users in profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    console.log('Profiles table data:', profilesData);
    if (profilesError) console.error('Profiles error:', profilesError);
    
    // 2. Specifically search for grashof@gmail.com in profiles
    const { data: grashofProfile, error: grashofError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', '%grashof@gmail.com%');
    
    console.log('Grashof profile search:', grashofProfile);
    if (grashofError) console.error('Grashof search error:', grashofError);
    
    // 3. Search for any emails containing "grashof" or "gmail"
    const { data: similarEmails, error: similarError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .or('email.ilike.%grashof%,email.ilike.%gmail%');
    
    console.log('Similar emails:', similarEmails);
    if (similarError) console.error('Similar emails error:', similarError);
    
    // 4. Count total profiles
    const { count: totalProfiles, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('Total profiles count:', totalProfiles);
    if (countError) console.error('Count error:', countError);
    
    // 5. Check recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('id, username, email, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    console.log('Recent users (7 days):', recentUsers);
    if (recentError) console.error('Recent users error:', recentError);
    
    return {
      allProfiles: profilesData,
      grashofProfile,
      similarEmails,
      totalProfiles,
      recentUsers,
      success: true
    };
    
  } catch (error) {
    console.error('Debug search error:', error);
    return {
      error,
      success: false
    };
  }
};

export const debugCreateTestUser = async () => {
  console.log('=== DEBUG: Creating test user grashof@gmail.com ===');
  
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'grashof@gmail.com')
      .single();
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return { user: existingUser, created: false };
    }
    
    // Create test user in profiles table
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        username: 'grashof_test',
        email: 'grashof@gmail.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating test user:', error);
      return { error, success: false };
    }
    
    console.log('Test user created:', newUser);
    return { user: newUser, created: true, success: true };
    
  } catch (error) {
    console.error('Error in debugCreateTestUser:', error);
    return { error, success: false };
  }
};

// Function to be called from browser console
(window as any).debugUsers = {
  search: debugSearchUsers,
  createTest: debugCreateTestUser
};