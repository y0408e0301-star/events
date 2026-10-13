-- prisma migrate dev はシャドウ DB を作って消すため、開発用の events ユーザーに全 DB への権限を与える
GRANT ALL PRIVILEGES ON *.* TO 'events'@'%';
FLUSH PRIVILEGES;
