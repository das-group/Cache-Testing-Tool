name := """CachingTest"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayJava)

scalaVersion := "2.12.2"

libraryDependencies += guice


// Testing libraries for dealing with CompletionStage...
libraryDependencies += "org.assertj" % "assertj-core" % "3.6.2" % Test
libraryDependencies += "org.awaitility" % "awaitility" % "2.0.0" % Test

// Apache HTTP Components
libraryDependencies += "org.apache.httpcomponents" % "httpclient" % "4.5.3"
libraryDependencies += "org.apache.httpcomponents" % "httpcore" % "4.4.6"

// https://mvnrepository.com/artifact/org.apache.ant/ant
libraryDependencies += "org.apache.ant" % "ant" % "1.8.2"

// https://mvnrepository.com/artifact/net.sourceforge.cssparser/cssparser
libraryDependencies += "net.sourceforge.cssparser" % "cssparser" % "0.9.24"


libraryDependencies ++= Seq(
  ehcache
)

libraryDependencies ++= Seq(
  cacheApi
)

// Make verbose tests
testOptions in Test := Seq(Tests.Argument(TestFrameworks.JUnit, "-a", "-v"))
