// Git Operations Handler - tenarch CRM Pro
// מטפל בפעולות Git (pull, push) דרך הדפדפן
// מעתיק פקודות Git ללוח כדי שהמשתמש יוכל להריץ בטרמינל

/**
 * Copy git pull command to clipboard
 * משוך שינויים מ-GitHub - מעתיק פקודה ללוח
 */
export async function gitPull(): Promise<{ success: boolean; message: string; output?: string }> {
  try {
    console.log('🔄 Copying git pull command...');
    
    const command = 'git pull';
    
    // Copy to clipboard
    await navigator.clipboard.writeText(command);
    
    return {
      success: true,
      message: 'הפקודה הועתקה ללוח! הדבק בטרמינל והרץ',
      output: `הפקודה שהועתקה: ${command}`,
    };
  } catch (error) {
    console.error('Git pull error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'שגיאה בהעתקת הפקודה',
    };
  }
}

/**
 * Copy git push command to clipboard
 * דחוף שינויים ל-GitHub - מעתיק פקודה ללוח
 */
export async function gitPush(): Promise<{ success: boolean; message: string; output?: string }> {
  try {
    console.log('⬆️ Copying git push command...');
    
    // Check if there are staged changes first
    const hasChangesCommand = 'git add . && git commit -m "Auto commit from DevTools" && git push';
    
    // Copy to clipboard
    await navigator.clipboard.writeText(hasChangesCommand);
    
    return {
      success: true,
      message: 'הפקודה הועתקה ללוח! הדבק בטרמינל והרץ',
      output: `הפקודה שהועתקה: ${hasChangesCommand}`,
    };
  } catch (error) {
    console.error('Git push error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'שגיאה בהעתקת הפקודה',
    };
  }
}

/**
 * Copy git status command to clipboard
 * קבל סטטוס Git - מעתיק פקודה ללוח
 */
export async function gitStatus(): Promise<{ 
  success: boolean; 
  message?: string;
  branch?: string;
  ahead?: number;
  behind?: number;
  modified?: number;
  untracked?: number;
}> {
  try {
    console.log('📊 Copying git status command...');
    
    const command = 'git status';
    
    // Copy to clipboard
    await navigator.clipboard.writeText(command);
    
    return {
      success: true,
      message: 'הפקודה הועתקה ללוח! הדבק בטרמינל להצגת סטטוס',
    };
  } catch (error) {
    console.error('Git status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'שגיאה בהעתקת הפקודה',
    };
  }
}
