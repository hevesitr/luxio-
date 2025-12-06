import { StyleSheet } from 'react-native';

const createStyles = (theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: 400,
      position: 'relative',
    },
    mainPhoto: {
      width: '100%',
      height: '100%',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50%',
      justifyContent: 'flex-end',
      padding: 20,
    },
    headerInfo: {
      gap: 15,
    },
    name: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      alignSelf: 'flex-start',
      gap: 8,
    },
    editButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    section: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 15,
      letterSpacing: -0.3,
    },
    bio: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    interestsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    interestTag: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    interestText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    photoContainer: {
      width: '31%',
      aspectRatio: 0.75,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    privateBadge: {
      position: 'absolute',
      top: 5,
      left: 5,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      gap: 4,
    },
    privateText: {
      color: '#FFD700',
      fontSize: 10,
      fontWeight: '600',
    },
    photoActions: {
      position: 'absolute',
      top: 5,
      right: 5,
      flexDirection: 'row',
      gap: 5,
    },
    photoActionButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      padding: 4,
    },
    photoActionButtonActive: {
      backgroundColor: 'rgba(255, 215, 0, 0.3)',
    },
    deletePhotoButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
    },
    completionContainer: {
      marginVertical: 10,
      width: '100%',
    },
    completionBar: {
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 6,
    },
    completionFill: {
      height: '100%',
      borderRadius: 4,
    },
    completionText: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    addPhotoButton: {
      width: '31%',
      aspectRatio: 0.75,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderStyle: 'dashed',
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    settingTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    settingSubtitle: {
      fontSize: 13,


});

export { createStyles };
