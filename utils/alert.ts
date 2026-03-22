import { Alert } from 'react-native';

export function showError(message: string) {
  Alert.alert(
    'Error',
    message
  );
}

export function showConfirm(message: string, onConfirm: () => void, cancelText: string = 'Cancel', confirmText: string = 'OK') {
  Alert.alert(
    'Confirm',
    message,
    [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]
  );
}