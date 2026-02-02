/**
 * File Statistics Dashboard - סטטיסטיקות וניתוחים
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  HardDrive,
  TrendingUp,
  Download,
  Eye,
  Upload,
  Star,
  Users,
} from 'lucide-react';
import type { FileStats } from '@/hooks/useAdvancedFiles';

interface FileStatsCardProps {
  stats: FileStats | null;
  isLoading?: boolean;
}

export function FileStatsCard({ stats, isLoading }: FileStatsCardProps) {
  if (isLoading || !stats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 1) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'archive': return <Archive className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-blue-600 bg-blue-50';
      case 'video': return 'text-purple-600 bg-purple-50';
      case 'audio': return 'text-green-600 bg-green-50';
      case 'document': return 'text-orange-600 bg-orange-50';
      case 'archive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalStorageGB = 100; // סך הכל אחסון זמין
  const usedStorageGB = stats.totalSize / (1024 * 1024 * 1024);
  const storagePercentage = (usedStorageGB / totalStorageGB) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Files */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">סך הכל קבצים</p>
              <p className="text-2xl font-bold">{stats.totalFiles}</p>
            </div>
          </div>
        </Card>

        {/* Total Size */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">נפח מאוחסן</p>
              <p className="text-2xl font-bold">{formatSize(stats.totalSize)}</p>
            </div>
          </div>
        </Card>

        {/* Recent Uploads */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">העלאות השבוע</p>
              <p className="text-2xl font-bold">
                {stats.uploadsByMonth[0]?.count || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Most Downloaded */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">הורדות</p>
              <p className="text-2xl font-bold">
                {stats.mostDownloaded.reduce((sum, f) => sum + f.downloadCount, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">שימוש באחסון</h3>
            <Badge variant="outline">
              {usedStorageGB.toFixed(2)} / {totalStorageGB} GB
            </Badge>
          </div>
          <Progress value={storagePercentage} className="h-3" />
          <p className="text-sm text-gray-500">
            נותרו {(totalStorageGB - usedStorageGB).toFixed(2)} GB פנויים
          </p>
        </div>
      </Card>

      {/* Files by Type */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">קבצים לפי סוג</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(stats.filesByType).map(([type, count]) => (
            <div
              key={type}
              className={`p-4 rounded-lg ${getFileTypeColor(type)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getFileTypeIcon(type)}
                <span className="font-medium capitalize">{type}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-70">
                {((count / stats.totalFiles) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">תגיות פופולריות</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <Badge key={tag} variant="secondary" className="text-sm">
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Uploads */}
      {stats.recentUploads.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">העלאות אחרונות</h3>
          <div className="space-y-3">
            {stats.recentUploads.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className={`h-10 w-10 rounded flex items-center justify-center ${getFileTypeColor(file.type)}`}>
                    {getFileTypeIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
                {file.isStarred && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Most Downloaded Files */}
      {stats.mostDownloaded.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">קבצים מובילים</h3>
          <div className="space-y-3">
            {stats.mostDownloaded.slice(0, 5).map((file, index) => (
              <div key={file.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                </div>
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className={`h-10 w-10 rounded flex items-center justify-center ${getFileTypeColor(file.type)}`}>
                    {getFileTypeIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {file.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {file.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Uploads by Month */}
      {stats.uploadsByMonth.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">העלאות לפי חודש</h3>
          <div className="space-y-2">
            {stats.uploadsByMonth.map(({ month, count }) => {
              const maxCount = Math.max(...stats.uploadsByMonth.map(m => m.count));
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{month}</span>
                    <span className="font-medium">{count} קבצים</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
