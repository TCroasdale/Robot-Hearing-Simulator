dir=$(pwd)
xfce4-terminal --working-directory=$dir/server/ -H -e 'celery -A servertasks worker --loglevel=info'
# python server
