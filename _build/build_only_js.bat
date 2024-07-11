REM actually combine all the files
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_build\appender"
appender.py

REM backup all the old files before moving new ones
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\js"
del *.bk!
rename *.js *.bk!

REM move new ones
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_build\appender\appender_out"
move *.js "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\js"

PAUSE