REM actually combine all the files
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_build\appender"
appender.py

REM backup all the old files before moving new ones
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\css"
del *.bk!
rename *.css *.bk!

cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\js"
del *.bk!
rename *.js *.bk!

cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\tpl"
del *.bk!
rename *.tpl.htm *.bk!

REM move new ones
cd "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_build\appender\appender_out"
move *.css "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\css"
move *.js "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\js"
move *.tpl.htm "C:\Program Files (x86)\Zend\Apache2\htdocs\studybash\_inc\tpl"

PAUSE