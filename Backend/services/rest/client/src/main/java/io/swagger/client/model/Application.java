/*
 * edu-sharing Repository REST API
 * The public restful API of the edu-sharing repository.
 *
 * OpenAPI spec version: 1.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


package io.swagger.client.model;

import java.util.Objects;
import java.util.Arrays;
import com.google.gson.TypeAdapter;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.IOException;

/**
 * Application
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class Application {
  @SerializedName("id")
  private String id = null;

  @SerializedName("title")
  private String title = null;

  @SerializedName("webserverUrl")
  private String webserverUrl = null;

  @SerializedName("clientBaseUrl")
  private String clientBaseUrl = null;

  @SerializedName("type")
  private String type = null;

  @SerializedName("subtype")
  private String subtype = null;

  @SerializedName("repositoryType")
  private String repositoryType = null;

  @SerializedName("xml")
  private String xml = null;

  @SerializedName("file")
  private String file = null;

  @SerializedName("contentUrl")
  private String contentUrl = null;

  @SerializedName("configUrl")
  private String configUrl = null;

  public Application id(String id) {
    this.id = id;
    return this;
  }

   /**
   * Get id
   * @return id
  **/
  @ApiModelProperty(value = "")
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Application title(String title) {
    this.title = title;
    return this;
  }

   /**
   * Get title
   * @return title
  **/
  @ApiModelProperty(value = "")
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Application webserverUrl(String webserverUrl) {
    this.webserverUrl = webserverUrl;
    return this;
  }

   /**
   * Get webserverUrl
   * @return webserverUrl
  **/
  @ApiModelProperty(value = "")
  public String getWebserverUrl() {
    return webserverUrl;
  }

  public void setWebserverUrl(String webserverUrl) {
    this.webserverUrl = webserverUrl;
  }

  public Application clientBaseUrl(String clientBaseUrl) {
    this.clientBaseUrl = clientBaseUrl;
    return this;
  }

   /**
   * Get clientBaseUrl
   * @return clientBaseUrl
  **/
  @ApiModelProperty(value = "")
  public String getClientBaseUrl() {
    return clientBaseUrl;
  }

  public void setClientBaseUrl(String clientBaseUrl) {
    this.clientBaseUrl = clientBaseUrl;
  }

  public Application type(String type) {
    this.type = type;
    return this;
  }

   /**
   * Get type
   * @return type
  **/
  @ApiModelProperty(value = "")
  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public Application subtype(String subtype) {
    this.subtype = subtype;
    return this;
  }

   /**
   * Get subtype
   * @return subtype
  **/
  @ApiModelProperty(value = "")
  public String getSubtype() {
    return subtype;
  }

  public void setSubtype(String subtype) {
    this.subtype = subtype;
  }

  public Application repositoryType(String repositoryType) {
    this.repositoryType = repositoryType;
    return this;
  }

   /**
   * Get repositoryType
   * @return repositoryType
  **/
  @ApiModelProperty(value = "")
  public String getRepositoryType() {
    return repositoryType;
  }

  public void setRepositoryType(String repositoryType) {
    this.repositoryType = repositoryType;
  }

  public Application xml(String xml) {
    this.xml = xml;
    return this;
  }

   /**
   * Get xml
   * @return xml
  **/
  @ApiModelProperty(value = "")
  public String getXml() {
    return xml;
  }

  public void setXml(String xml) {
    this.xml = xml;
  }

  public Application file(String file) {
    this.file = file;
    return this;
  }

   /**
   * Get file
   * @return file
  **/
  @ApiModelProperty(value = "")
  public String getFile() {
    return file;
  }

  public void setFile(String file) {
    this.file = file;
  }

  public Application contentUrl(String contentUrl) {
    this.contentUrl = contentUrl;
    return this;
  }

   /**
   * Get contentUrl
   * @return contentUrl
  **/
  @ApiModelProperty(value = "")
  public String getContentUrl() {
    return contentUrl;
  }

  public void setContentUrl(String contentUrl) {
    this.contentUrl = contentUrl;
  }

  public Application configUrl(String configUrl) {
    this.configUrl = configUrl;
    return this;
  }

   /**
   * Get configUrl
   * @return configUrl
  **/
  @ApiModelProperty(value = "")
  public String getConfigUrl() {
    return configUrl;
  }

  public void setConfigUrl(String configUrl) {
    this.configUrl = configUrl;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Application application = (Application) o;
    return Objects.equals(this.id, application.id) &&
        Objects.equals(this.title, application.title) &&
        Objects.equals(this.webserverUrl, application.webserverUrl) &&
        Objects.equals(this.clientBaseUrl, application.clientBaseUrl) &&
        Objects.equals(this.type, application.type) &&
        Objects.equals(this.subtype, application.subtype) &&
        Objects.equals(this.repositoryType, application.repositoryType) &&
        Objects.equals(this.xml, application.xml) &&
        Objects.equals(this.file, application.file) &&
        Objects.equals(this.contentUrl, application.contentUrl) &&
        Objects.equals(this.configUrl, application.configUrl);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, title, webserverUrl, clientBaseUrl, type, subtype, repositoryType, xml, file, contentUrl, configUrl);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Application {\n");
    
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
    sb.append("    webserverUrl: ").append(toIndentedString(webserverUrl)).append("\n");
    sb.append("    clientBaseUrl: ").append(toIndentedString(clientBaseUrl)).append("\n");
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
    sb.append("    subtype: ").append(toIndentedString(subtype)).append("\n");
    sb.append("    repositoryType: ").append(toIndentedString(repositoryType)).append("\n");
    sb.append("    xml: ").append(toIndentedString(xml)).append("\n");
    sb.append("    file: ").append(toIndentedString(file)).append("\n");
    sb.append("    contentUrl: ").append(toIndentedString(contentUrl)).append("\n");
    sb.append("    configUrl: ").append(toIndentedString(configUrl)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }

}
