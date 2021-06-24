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
 * ViewV2
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class ViewV2 {
  @SerializedName("id")
  private String id = null;

  @SerializedName("caption")
  private String caption = null;

  @SerializedName("icon")
  private String icon = null;

  @SerializedName("html")
  private String html = null;

  @SerializedName("rel")
  private String rel = null;

  @SerializedName("hideIfEmpty")
  private Boolean hideIfEmpty = false;

  @SerializedName("isExtended")
  private Boolean isExtended = false;

  public ViewV2 id(String id) {
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

  public ViewV2 caption(String caption) {
    this.caption = caption;
    return this;
  }

   /**
   * Get caption
   * @return caption
  **/
  @ApiModelProperty(value = "")
  public String getCaption() {
    return caption;
  }

  public void setCaption(String caption) {
    this.caption = caption;
  }

  public ViewV2 icon(String icon) {
    this.icon = icon;
    return this;
  }

   /**
   * Get icon
   * @return icon
  **/
  @ApiModelProperty(value = "")
  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public ViewV2 html(String html) {
    this.html = html;
    return this;
  }

   /**
   * Get html
   * @return html
  **/
  @ApiModelProperty(value = "")
  public String getHtml() {
    return html;
  }

  public void setHtml(String html) {
    this.html = html;
  }

  public ViewV2 rel(String rel) {
    this.rel = rel;
    return this;
  }

   /**
   * Get rel
   * @return rel
  **/
  @ApiModelProperty(value = "")
  public String getRel() {
    return rel;
  }

  public void setRel(String rel) {
    this.rel = rel;
  }

  public ViewV2 hideIfEmpty(Boolean hideIfEmpty) {
    this.hideIfEmpty = hideIfEmpty;
    return this;
  }

   /**
   * Get hideIfEmpty
   * @return hideIfEmpty
  **/
  @ApiModelProperty(value = "")
  public Boolean isHideIfEmpty() {
    return hideIfEmpty;
  }

  public void setHideIfEmpty(Boolean hideIfEmpty) {
    this.hideIfEmpty = hideIfEmpty;
  }

  public ViewV2 isExtended(Boolean isExtended) {
    this.isExtended = isExtended;
    return this;
  }

   /**
   * Get isExtended
   * @return isExtended
  **/
  @ApiModelProperty(value = "")
  public Boolean isIsExtended() {
    return isExtended;
  }

  public void setIsExtended(Boolean isExtended) {
    this.isExtended = isExtended;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ViewV2 viewV2 = (ViewV2) o;
    return Objects.equals(this.id, viewV2.id) &&
        Objects.equals(this.caption, viewV2.caption) &&
        Objects.equals(this.icon, viewV2.icon) &&
        Objects.equals(this.html, viewV2.html) &&
        Objects.equals(this.rel, viewV2.rel) &&
        Objects.equals(this.hideIfEmpty, viewV2.hideIfEmpty) &&
        Objects.equals(this.isExtended, viewV2.isExtended);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, caption, icon, html, rel, hideIfEmpty, isExtended);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ViewV2 {\n");
    
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    caption: ").append(toIndentedString(caption)).append("\n");
    sb.append("    icon: ").append(toIndentedString(icon)).append("\n");
    sb.append("    html: ").append(toIndentedString(html)).append("\n");
    sb.append("    rel: ").append(toIndentedString(rel)).append("\n");
    sb.append("    hideIfEmpty: ").append(toIndentedString(hideIfEmpty)).append("\n");
    sb.append("    isExtended: ").append(toIndentedString(isExtended)).append("\n");
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
